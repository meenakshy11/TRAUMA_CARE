from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.ambulance_service import (
    list_ambulances, get_ambulance, update_ambulance_location,
    update_ambulance_status, list_staging_stations
)
from app.services.notification_service import manager
import uuid

router = APIRouter(prefix="/ambulances", tags=["ambulances"])


class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    speed_kmph: Optional[float] = None
    heading: Optional[float] = None
    incident_id: Optional[uuid.UUID] = None


class StatusUpdate(BaseModel):
    status: str


class AmbulanceCreate(BaseModel):
    registration_no: str
    ambulance_type: str = "BLS"
    district: str
    staging_station_id: Optional[uuid.UUID] = None
    device_id: Optional[str] = None
    current_lat: Optional[float] = None
    current_lon: Optional[float] = None


def serialize_ambulance(amb) -> dict:
    return {
        "id": str(amb.id),
        "registration_no": amb.registration_no,
        "ambulance_type": amb.ambulance_type,
        "status": amb.status,
        "current_lat": amb.current_lat,
        "current_lon": amb.current_lon,
        "last_location_at": amb.last_location_at.isoformat() if amb.last_location_at else None,
        "district": amb.district,
        "is_active": amb.is_active,
        "staging_station_id": str(amb.staging_station_id) if amb.staging_station_id else None,
        "device_id": amb.device_id,
        "speed_kmph": amb.speed_kmph,
        "created_at": amb.created_at.isoformat() if amb.created_at else None,
    }


@router.get("")
async def list_all(
    status: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "GOVERNMENT" and getattr(current_user, "district", None) and not district:
        district = current_user.district
    ambulances = await list_ambulances(db, status=status, district=district)
    return [serialize_ambulance(a) for a in ambulances]


@router.get("/stations")
async def get_stations(
    district: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stations = await list_staging_stations(db, district=district)
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "district": s.district,
            "fuel_brand": s.fuel_brand,
            "capacity": s.capacity,
            "nearby_blackspot_count": s.nearby_blackspot_count,
            "ambulance_count": len(s.ambulances),
        }
        for s in stations
    ]


@router.get("/{ambulance_id}")
async def get_one(
    ambulance_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    amb = await get_ambulance(db, ambulance_id)
    if not amb:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Ambulance")
    return serialize_ambulance(amb)


@router.post("/{ambulance_id}/location")
async def push_location(
    ambulance_id: uuid.UUID,
    body: LocationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    amb = await update_ambulance_location(
        db, ambulance_id, body.latitude, body.longitude,
        body.speed_kmph, body.heading, body.incident_id
    )
    if not amb:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Ambulance")
    await db.commit()
    await manager.broadcast_ambulance_location(
        str(ambulance_id), body.latitude, body.longitude, str(amb.status)
    )
    return {"status": "location updated"}


@router.patch("/{ambulance_id}/status")
async def update_status(
    ambulance_id: uuid.UUID,
    body: StatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    amb = await update_ambulance_status(db, ambulance_id, body.status)
    if not amb:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Ambulance")
    await db.commit()
    return serialize_ambulance(amb)


@router.post("")
async def create_ambulance(
    body: AmbulanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.ambulance import Ambulance
    from app.core.constants import AmbulanceType, AmbulanceStatus
    amb = Ambulance(
        registration_no=body.registration_no,
        ambulance_type=AmbulanceType(body.ambulance_type),
        district=body.district,
        staging_station_id=body.staging_station_id,
        device_id=body.device_id,
        current_lat=body.current_lat,
        current_lon=body.current_lon,
        status=AmbulanceStatus.AVAILABLE,
    )
    db.add(amb)
    await db.commit()
    await db.refresh(amb)
    return serialize_ambulance(amb)


