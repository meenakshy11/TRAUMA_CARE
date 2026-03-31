from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from app.models.ambulance import Ambulance, AmbulanceLocationHistory, StagingStation
from app.core.constants import AmbulanceStatus


async def list_ambulances(db: AsyncSession, status: Optional[str] = None,
                          district: Optional[str] = None) -> List[Ambulance]:
    query = select(Ambulance)
    if status:
        query = query.where(Ambulance.status == AmbulanceStatus(status))
    if district:
        query = query.where(Ambulance.district == district)
    result = await db.execute(query)
    return result.scalars().all()


async def get_ambulance(db: AsyncSession, ambulance_id: uuid.UUID) -> Optional[Ambulance]:
    result = await db.execute(select(Ambulance).where(Ambulance.id == ambulance_id))
    return result.scalar_one_or_none()


async def update_ambulance_location(
    db: AsyncSession,
    ambulance_id: uuid.UUID,
    latitude: float,
    longitude: float,
    speed_kmph: Optional[float] = None,
    heading: Optional[float] = None,
    incident_id: Optional[uuid.UUID] = None,
) -> Optional[Ambulance]:
    result = await db.execute(select(Ambulance).where(Ambulance.id == ambulance_id))
    ambulance = result.scalar_one_or_none()
    if not ambulance:
        return None
    ambulance.current_lat = latitude
    ambulance.current_lon = longitude
    ambulance.last_location_at = datetime.now(timezone.utc)
    if speed_kmph is not None:
        ambulance.speed_kmph = speed_kmph

    history = AmbulanceLocationHistory(
        ambulance_id=ambulance_id,
        latitude=latitude,
        longitude=longitude,
        speed_kmph=speed_kmph,
        heading=heading,
        incident_id=incident_id,
    )
    db.add(history)
    await db.flush()
    return ambulance


async def update_ambulance_status(
    db: AsyncSession,
    ambulance_id: uuid.UUID,
    status: str,
) -> Optional[Ambulance]:
    result = await db.execute(select(Ambulance).where(Ambulance.id == ambulance_id))
    ambulance = result.scalar_one_or_none()
    if not ambulance:
        return None
    ambulance.status = AmbulanceStatus(status)
    await db.flush()
    return ambulance


async def list_staging_stations(db: AsyncSession, district: Optional[str] = None) -> List[StagingStation]:
    query = select(StagingStation).options(selectinload(StagingStation.ambulances))
    if district:
        query = query.where(StagingStation.district == district)
    result = await db.execute(query)
    return result.scalars().all()
