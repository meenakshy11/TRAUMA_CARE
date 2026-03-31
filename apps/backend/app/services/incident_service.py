from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from app.models.incident import Incident, IncidentTimeline, IncidentPhoto
from app.core.constants import IncidentStatus, IncidentSeverity, AccidentType


def generate_incident_number() -> str:
    from datetime import date
    import random, string
    today = date.today().strftime("%Y%m%d")
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"TRK-{today}-{suffix}"


async def create_incident(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    severity: Optional[str],
    accident_type: Optional[str],
    patient_count: int = 1,
    description: Optional[str] = None,
    district: Optional[str] = None,
    address_text: Optional[str] = None,
    reported_by_id: Optional[uuid.UUID] = None,
) -> Incident:
    incident = Incident(
        incident_number=generate_incident_number(),
        latitude=latitude,
        longitude=longitude,
        severity=IncidentSeverity(severity) if severity else None,
        accident_type=AccidentType(accident_type) if accident_type else None,
        patient_count=patient_count,
        description=description,
        district=district,
        address_text=address_text,
        reported_by_id=reported_by_id,
        status=IncidentStatus.REPORTED,
    )
    db.add(incident)
    await db.flush()
    timeline = IncidentTimeline(
        incident_id=incident.id,
        status=IncidentStatus.REPORTED,
        note="Incident created",
        actor_id=reported_by_id,
    )
    db.add(timeline)
    await db.flush()
    return incident


async def get_incident(db: AsyncSession, incident_id: uuid.UUID) -> Optional[Incident]:
    result = await db.execute(
        select(Incident)
        .options(
            selectinload(Incident.timeline),
            selectinload(Incident.photos),
            selectinload(Incident.patients),
        )
        .where(Incident.id == incident_id)
    )
    return result.scalar_one_or_none()


async def list_incidents(
    db: AsyncSession,
    status: Optional[str] = None,
    district: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
) -> List[Incident]:
    query = select(Incident).options(selectinload(Incident.timeline))
    if status:
        query = query.where(Incident.status == IncidentStatus(status))
    if district:
        query = query.where(Incident.district == district)
    query = query.order_by(desc(Incident.created_at)).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def get_active_incidents(db: AsyncSession) -> List[Incident]:
    closed = [IncidentStatus.CLOSED, IncidentStatus.CANCELLED]
    result = await db.execute(
        select(Incident)
        .where(Incident.status.notin_(closed))
        .order_by(desc(Incident.created_at))
    )
    return result.scalars().all()


async def update_incident_status(
    db: AsyncSession,
    incident_id: uuid.UUID,
    new_status: str,
    actor_id: Optional[uuid.UUID] = None,
    note: Optional[str] = None,
) -> Optional[Incident]:
    result = await db.execute(
        select(Incident)
        .options(selectinload(Incident.timeline))
        .where(Incident.id == incident_id)
    )
    incident = result.scalar_one_or_none()
    if not incident:
        return None
    incident.status = IncidentStatus(new_status)
    if new_status == IncidentStatus.HOSPITAL_ARRIVED:
        elapsed = (datetime.now(timezone.utc) - incident.created_at.replace(tzinfo=timezone.utc)).total_seconds()
        incident.golden_hour_met = elapsed <= 3600
    timeline = IncidentTimeline(
        incident_id=incident.id,
        status=IncidentStatus(new_status),
        note=note or f"Status updated to {new_status}",
        actor_id=actor_id,
    )
    db.add(timeline)
    await db.flush()
    return incident
