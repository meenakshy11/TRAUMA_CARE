from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional
from datetime import datetime, timezone, timedelta

from app.models.incident import Incident
from app.models.dispatch import DispatchRecord
from app.models.ambulance import Ambulance
from app.models.hospital import Hospital, HospitalResource
from app.core.constants import IncidentStatus, AmbulanceStatus


async def get_kpi_summary(db: AsyncSession, district: Optional[str] = None) -> dict:
    # Active incidents
    closed = [IncidentStatus.CLOSED, IncidentStatus.CANCELLED]
    active_q = select(func.count()).select_from(Incident).where(Incident.status.notin_(closed))
    if district:
        active_q = active_q.where(Incident.district == district)
    active_result = await db.execute(active_q)
    active_count = active_result.scalar() or 0

    # Total incidents today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_q = select(func.count()).select_from(Incident).where(Incident.created_at >= today_start)
    today_result = await db.execute(today_q)
    today_count = today_result.scalar() or 0

    # Available ambulances
    avail_q = select(func.count()).select_from(Ambulance).where(
        Ambulance.status == AmbulanceStatus.AVAILABLE, Ambulance.is_active == True
    )
    avail_result = await db.execute(avail_q)
    available_ambulances = avail_result.scalar() or 0

    # Golden hour compliance
    closed_q = select(Incident).where(Incident.status == IncidentStatus.HOSPITAL_ARRIVED)
    closed_result = await db.execute(closed_q)
    closed_incidents = closed_result.scalars().all()
    golden_met = sum(1 for i in closed_incidents if i.golden_hour_met)
    total_closed = len(closed_incidents)
    compliance_pct = round((golden_met / total_closed * 100), 1) if total_closed > 0 else 0.0

    # Hospital summary
    hosp_q = select(func.count()).select_from(Hospital).where(Hospital.is_active == True)
    hosp_result = await db.execute(hosp_q)
    hospital_count = hosp_result.scalar() or 0

    return {
        "active_incidents": active_count,
        "total_incidents_today": today_count,
        "ambulances_available": available_ambulances,
        "golden_hour_compliance_pct": compliance_pct,
        "hospital_count": hospital_count,
        "ambulances_deployed": active_count,
    }


async def get_district_performance(db: AsyncSession) -> list:
    result = await db.execute(
        select(
            Incident.district,
            func.count(Incident.id).label("total"),
            func.sum(func.cast(Incident.golden_hour_met, db.bind.dialect.name == 'postgresql' and 'integer' or 'integer')).label("golden_met"),
        )
        .where(Incident.district.isnot(None))
        .group_by(Incident.district)
    )
    rows = result.all()
    return [
        {
            "district": r.district,
            "total_incidents": r.total,
            "golden_hour_met": r.golden_met or 0,
            "compliance_pct": round((r.golden_met or 0) / r.total * 100, 1) if r.total else 0,
        }
        for r in rows
    ]
