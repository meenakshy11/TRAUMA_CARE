from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, List
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.simulation_service import (
    run_accident_simulation,
    get_coverage_heatmap,
    test_infrastructure_scenario,
    run_coverage_simulation,
)

router = APIRouter(prefix="/simulation", tags=["simulation"])


# ── Request / Response models ─────────────────────────────────────────────────

class SimulationRequest(BaseModel):
    """Legacy coverage-gap analysis request."""
    district: Optional[str] = None
    new_base_lat: Optional[float] = None
    new_base_lon: Optional[float] = None
    new_hospital_lat: Optional[float] = None
    new_hospital_lon: Optional[float] = None


class AccidentSimRequest(BaseModel):
    """Map-click accident simulation request."""
    lat: float = Field(..., ge=-90, le=90, description="Accident latitude")
    lng: float = Field(..., ge=-180, le=180, description="Accident longitude")
    severity: Optional[str] = Field("SEVERE", description="CRITICAL | SEVERE | MODERATE | MINOR")

    class Config:
        json_schema_extra = {
            "example": {
                "lat": 9.9312,
                "lng": 76.2673,
                "severity": "CRITICAL",
            }
        }


class InfrastructureRequest(BaseModel):
    """Test a hypothetical new ambulance base."""
    new_base_lat: float = Field(..., ge=-90, le=90)
    new_base_lon: float = Field(..., ge=-180, le=180)
    district: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/run")
async def run_simulation_legacy(
    body: SimulationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Legacy blackspot coverage gap analysis."""
    return await run_coverage_simulation(
        db,
        district=body.district,
        new_base_lat=body.new_base_lat,
        new_base_lon=body.new_base_lon,
        new_hospital_lat=body.new_hospital_lat,
        new_hospital_lon=body.new_hospital_lon,
    )


@router.post("/accident")
async def simulate_accident(
    body: AccidentSimRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Core simulation endpoint.

    Given an accident location (lat/lng) and severity:
    1. Finds nearest AVAILABLE ambulance
    2. Selects best trauma-capable hospital
    3. Calculates dispatch_time, scene_time, transport_time
    4. Returns golden hour status

    Used by the map-click flow on the Simulation page.
    """
    return await run_accident_simulation(
        db,
        lat=body.lat,
        lon=body.lng,
        severity=body.severity or "SEVERE",
    )


@router.get("/coverage")
async def simulation_coverage(
    district: Optional[str] = Query(None, description="Filter by district"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns coverage zones for all active ambulances.
    Each zone includes 15 / 30 / 45 minute radius circles.
    Used by the Golden Hour Coverage Map panel.
    """
    return await get_coverage_heatmap(db, district=district)


@router.post("/infrastructure")
async def infrastructure_test(
    body: InfrastructureRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Test adding a hypothetical ambulance base.
    Returns before/after average response times and coverage improvement.
    """
    return await test_infrastructure_scenario(
        db,
        new_base_lat=body.new_base_lat,
        new_base_lon=body.new_base_lon,
        district=body.district,
    )
