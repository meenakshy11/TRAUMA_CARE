from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional, List
import uuid

from app.models.hospital import Hospital, HospitalResource, TraumaSlot
from app.services.geo_service import haversine_distance


async def get_hospital(db: AsyncSession, hospital_id: uuid.UUID) -> Optional[Hospital]:
    result = await db.execute(
        select(Hospital)
        .options(selectinload(Hospital.resources))
        .where(Hospital.id == hospital_id)
    )
    return result.scalar_one_or_none()


async def list_hospitals(db: AsyncSession, district: Optional[str] = None,
                         trauma_level: Optional[str] = None) -> List[Hospital]:
    query = select(Hospital).options(selectinload(Hospital.resources)).where(Hospital.is_active == True)
    if district:
        query = query.where(Hospital.district == district)
    if trauma_level:
        from app.core.constants import TraumaLevel
        query = query.where(Hospital.trauma_level == TraumaLevel(trauma_level))
    result = await db.execute(query)
    return result.scalars().all()


async def update_resources(
    db: AsyncSession,
    hospital_id: uuid.UUID,
    updated_by: Optional[uuid.UUID] = None,
    **kwargs,
) -> Optional[HospitalResource]:
    result = await db.execute(
        select(HospitalResource).where(HospitalResource.hospital_id == hospital_id)
    )
    resource = result.scalar_one_or_none()
    if not resource:
        resource = HospitalResource(hospital_id=hospital_id)
        db.add(resource)
    for key, value in kwargs.items():
        if hasattr(resource, key) and value is not None:
            setattr(resource, key, value)
    resource.last_updated_by = updated_by
    await db.flush()
    return resource


async def reserve_trauma_slot(
    db: AsyncSession,
    hospital_id: uuid.UUID,
    incident_id: uuid.UUID,
    patient_id: Optional[uuid.UUID] = None,
) -> TraumaSlot:
    from datetime import datetime, timezone
    slot = TraumaSlot(
        hospital_id=hospital_id,
        incident_id=incident_id,
        patient_id=patient_id,
        is_active=True,
    )
    db.add(slot)
    # Decrement available ICU beds
    res_result = await db.execute(
        select(HospitalResource).where(HospitalResource.hospital_id == hospital_id)
    )
    res = res_result.scalar_one_or_none()
    if res and res.icu_beds_available > 0:
        res.icu_beds_available -= 1
    await db.flush()
    return slot


async def recommend_hospital(
    db: AsyncSession,
    lat: float,
    lon: float,
    triage_color: Optional[str] = None,
) -> Optional[Hospital]:
    hospitals = await list_hospitals(db)
    scored = []
    for h in hospitals:
        if not h.resources:
            continue
        if h.resources.icu_beds_available <= 0:
            continue
        dist = haversine_distance(lat, lon, h.latitude, h.longitude)
        scored.append((dist, h))
    if not scored:
        return None
    scored.sort(key=lambda x: x[0])
    return scored[0][1]
