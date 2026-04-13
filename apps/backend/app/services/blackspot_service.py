from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
import uuid

from app.models.blackspot import BlackSpot
from app.core.constants import BlackSpotSeverity


async def list_blackspots(db: AsyncSession, district: Optional[str] = None) -> List[BlackSpot]:
    query = select(BlackSpot)
    if district:
        query = query.where(BlackSpot.district == district)
    query = query.order_by(BlackSpot.priority.asc().nullslast(), BlackSpot.risk_score.desc())
    result = await db.execute(query)
    return result.scalars().all()


async def create_blackspot(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    district: str,
    police_station: Optional[str] = None,
    location: Optional[str] = None,
    priority: Optional[str] = None,
    road_name: Optional[str] = None,
    road_number: Optional[str] = None,
    road_type: Optional[str] = None,
    road_length: Optional[str] = None,
    start_latitude: Optional[float] = None,
    start_longitude: Optional[float] = None,
    end_latitude: Optional[float] = None,
    end_longitude: Optional[float] = None,
    incident_count: int = 0,
    fatality_rate: Optional[float] = None,
    accidents_per_year: int = 0,
    description: Optional[str] = None,
    severity: Optional[str] = None,
) -> BlackSpot:
    risk_score = min(10.0, (incident_count / 10) + (fatality_rate or 0) * 0.5)
    bs = BlackSpot(
        latitude=latitude,
        longitude=longitude,
        district=district,
        police_station=police_station,
        location=location,
        priority=priority,
        road_name=road_name,
        road_number=road_number,
        road_type=road_type,
        road_length=road_length,
        start_latitude=start_latitude,
        start_longitude=start_longitude,
        end_latitude=end_latitude,
        end_longitude=end_longitude,
        incident_count=incident_count,
        fatality_rate=fatality_rate,
        accidents_per_year=accidents_per_year,
        description=description,
        risk_score=risk_score,
        severity=BlackSpotSeverity(severity) if severity else None,
    )
    db.add(bs)
    await db.flush()
    return bs


async def get_heatmap_data(db: AsyncSession, district: Optional[str] = None) -> List[dict]:
    spots = await list_blackspots(db, district)
    return [
        {
            "lat": s.latitude,
            "lon": s.longitude,
            "weight": s.risk_score,
            "district": s.district,
        }
        for s in spots
    ]
