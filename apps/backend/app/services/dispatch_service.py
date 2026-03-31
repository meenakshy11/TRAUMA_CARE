from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
import uuid

from app.models.ambulance import Ambulance
from app.models.hospital import Hospital, HospitalResource
from app.models.incident import Incident
from app.models.dispatch import DispatchRecord
from app.core.constants import AmbulanceStatus, AmbulanceType, TraumaLevel, IncidentSeverity
from app.services.geo_service import haversine_distance, estimate_eta_minutes


AMBULANCE_TYPE_WEIGHT = {
    AmbulanceType.ALS: 1.0,
    AmbulanceType.BLS: 1.3,
    AmbulanceType.NICU: 1.5,
    AmbulanceType.MFR: 1.2,
}

SEVERITY_REQUIRED_LEVEL = {
    IncidentSeverity.CRITICAL: TraumaLevel.LEVEL_1,
    IncidentSeverity.SEVERE: TraumaLevel.LEVEL_2,
    IncidentSeverity.MODERATE: TraumaLevel.LEVEL_2,
    IncidentSeverity.MINOR: TraumaLevel.COMMUNITY,
    IncidentSeverity.MCI: TraumaLevel.LEVEL_1,
}


async def get_dispatch_recommendations(
    db: AsyncSession,
    incident_id: uuid.UUID,
    top_n: int = 3,
) -> dict:
    incident_result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = incident_result.scalar_one_or_none()
    if not incident:
        return {"ambulances": [], "hospitals": []}

    # Get available ambulances
    amb_result = await db.execute(
        select(Ambulance).where(
            and_(Ambulance.status == AmbulanceStatus.AVAILABLE, Ambulance.is_active == True)
        )
    )
    ambulances = amb_result.scalars().all()

    # Score and rank ambulances
    scored = []
    for amb in ambulances:
        if amb.current_lat is None or amb.current_lon is None:
            continue
        dist = haversine_distance(incident.latitude, incident.longitude, amb.current_lat, amb.current_lon)
        weight = AMBULANCE_TYPE_WEIGHT.get(amb.ambulance_type, 1.5)
        score = dist * weight
        eta = estimate_eta_minutes(dist)
        scored.append({
            "ambulance_id": str(amb.id),
            "registration_no": amb.registration_no,
            "ambulance_type": amb.ambulance_type,
            "district": amb.district,
            "distance_km": round(dist, 2),
            "eta_minutes": round(eta, 1),
            "score": round(score, 3),
            "current_lat": amb.current_lat,
            "current_lon": amb.current_lon,
        })
    scored.sort(key=lambda x: x["score"])

    # Get suitable hospitals
    hosp_result = await db.execute(
        select(Hospital, HospitalResource)
        .join(HospitalResource, Hospital.id == HospitalResource.hospital_id, isouter=True)
        .where(Hospital.is_active == True)
    )
    hospitals_data = hosp_result.all()

    hospital_recs = []
    for hosp, res in hospitals_data:
        dist = haversine_distance(incident.latitude, incident.longitude, hosp.latitude, hosp.longitude)
        eta = estimate_eta_minutes(dist)
        icu_available = res.icu_beds_available if res else 0
        hospital_recs.append({
            "hospital_id": str(hosp.id),
            "name": hosp.name,
            "district": hosp.district,
            "trauma_level": hosp.trauma_level,
            "distance_km": round(dist, 2),
            "eta_minutes": round(eta, 1),
            "icu_beds_available": icu_available,
            "ot_available": res.ot_available if res else False,
            "blood_bank_available": res.blood_bank_available if res else False,
        })
    hospital_recs.sort(key=lambda x: (x["distance_km"], -x["icu_beds_available"]))

    return {
        "ambulances": scored[:top_n],
        "hospitals": hospital_recs[:top_n],
    }


async def confirm_dispatch(
    db: AsyncSession,
    incident_id: uuid.UUID,
    ambulance_id: uuid.UUID,
    hospital_id: Optional[uuid.UUID],
    dispatcher_id: Optional[uuid.UUID],
    was_auto: bool = False,
) -> DispatchRecord:
    from datetime import datetime, timezone
    from app.core.constants import IncidentStatus
    from app.services.incident_service import update_incident_status

    # Update ambulance status
    amb_result = await db.execute(select(Ambulance).where(Ambulance.id == ambulance_id))
    ambulance = amb_result.scalar_one_or_none()
    if ambulance:
        ambulance.status = AmbulanceStatus.DISPATCHED

    # Update incident
    inc_result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = inc_result.scalar_one_or_none()
    if incident:
        incident.dispatched_ambulance_id = ambulance_id
        incident.receiving_hospital_id = hospital_id
        incident.status = IncidentStatus.DISPATCHED

    # Create dispatch record
    record = DispatchRecord(
        incident_id=incident_id,
        ambulance_id=ambulance_id,
        hospital_id=hospital_id,
        dispatcher_id=dispatcher_id,
        was_auto=was_auto,
        dispatched_at=datetime.now(timezone.utc),
    )
    db.add(record)
    await db.flush()
    return record
