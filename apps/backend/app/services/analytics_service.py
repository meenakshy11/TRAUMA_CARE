from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, Integer
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
    # Count all incidents per district
    total_q = await db.execute(
        select(
            Incident.district,
            func.count(Incident.id).label("total"),
            func.sum(
                func.cast(Incident.golden_hour_met, Integer)
            ).label("golden_met"),
        )
        .where(Incident.district.isnot(None))
        .group_by(Incident.district)
        .order_by(func.count(Incident.id).desc())
    )
    rows = total_q.all()
    return [
        {
            "district": r.district,
            "total_incidents": r.total,
            "golden_hour_met": int(r.golden_met or 0),
            "compliance_pct": round(int(r.golden_met or 0) / r.total * 100, 1) if r.total else 0.0,
        }
        for r in rows
        if r.district  # skip any null districts
    ]


async def get_monthly_trends(db: AsyncSession, district: Optional[str] = None) -> list:
    from app.models.incident import Incident
    results = []
    for i in range(5, -1, -1):
        from datetime import date
        import calendar
        today = datetime.now(timezone.utc)
        month_date = (today.replace(day=1) - timedelta(days=1)) if i == 0 else today
        # Calculate month i months ago
        month = (today.month - i - 1) % 12 + 1
        year = today.year - ((today.month - i - 1) // 12)
        month_start = datetime(year, month, 1, tzinfo=timezone.utc)
        last_day = calendar.monthrange(year, month)[1]
        month_end = datetime(year, month, last_day, 23, 59, 59, tzinfo=timezone.utc)
        
        q = select(func.count(Incident.id)).where(
            Incident.created_at >= month_start,
            Incident.created_at <= month_end
        )
        if district:
            q = q.where(Incident.district == district)
        total = (await db.execute(q)).scalar() or 0
        
        q2 = select(func.count(Incident.id)).where(
            Incident.created_at >= month_start,
            Incident.created_at <= month_end,
            Incident.golden_hour_met == True
        )
        if district:
            q2 = q2.where(Incident.district == district)
        golden = (await db.execute(q2)).scalar() or 0
        
        results.append({
            "month": month_start.strftime("%b"),
            "incidents": total,
            "golden_met": golden
        })
    return results
