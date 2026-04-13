from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.blackspot_service import list_blackspots, create_blackspot, get_heatmap_data

router = APIRouter(prefix="/blackspots", tags=["blackspots"])


class BlackSpotCreate(BaseModel):
    latitude: float
    longitude: float
    district: str
    name: Optional[str] = None
    road_name: Optional[str] = None
    incident_count: int = 0
    fatality_rate: Optional[float] = None
    accidents_per_year: int = 0
    description: Optional[str] = None
    severity: Optional[str] = None


def serialize_bs(bs) -> dict:
    return {
        "id": str(bs.id),
        "name": bs.name,
        "latitude": bs.latitude,
        "longitude": bs.longitude,
        "district": bs.district,
        "road_name": bs.road_name,
        "incident_count": bs.incident_count,
        "fatality_rate": bs.fatality_rate,
        "accidents_per_year": bs.accidents_per_year,
        "risk_score": bs.risk_score,
        "severity": bs.severity,
        "description": bs.description,
        "created_at": bs.created_at.isoformat() if bs.created_at else None,
    }


@router.get("")
async def list_all(
    district: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "GOVERNMENT" and getattr(current_user, "district", None) and not district:
        district = current_user.district
    spots = await list_blackspots(db, district=district)
    return [serialize_bs(s) for s in spots]


@router.get("/heatmap")
async def heatmap(
    district: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_heatmap_data(db, district=district)


@router.post("")
async def create(
    body: BlackSpotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bs = await create_blackspot(db, **body.model_dump())
    await db.commit()
    return serialize_bs(bs)


