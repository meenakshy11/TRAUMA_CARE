from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.simulation_service import run_coverage_simulation

router = APIRouter(prefix="/simulation", tags=["simulation"])


class SimulationRequest(BaseModel):
    district: Optional[str] = None
    new_base_lat: Optional[float] = None
    new_base_lon: Optional[float] = None
    new_hospital_lat: Optional[float] = None
    new_hospital_lon: Optional[float] = None


@router.post("/run")
async def run_simulation(
    body: SimulationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await run_coverage_simulation(
        db,
        district=body.district,
        new_base_lat=body.new_base_lat,
        new_base_lon=body.new_base_lon,
        new_hospital_lat=body.new_hospital_lat,
        new_hospital_lon=body.new_hospital_lon,
    )
