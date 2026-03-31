from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
import uuid

from app.models.ambulance import Ambulance, StagingStation
from app.models.blackspot import BlackSpot
from app.models.hospital import Hospital
from app.services.geo_service import haversine_distance, estimate_eta_minutes
from app.core.constants import AmbulanceStatus


async def run_coverage_simulation(
    db: AsyncSession,
    district: Optional[str] = None,
    new_base_lat: Optional[float] = None,
    new_base_lon: Optional[float] = None,
    new_hospital_lat: Optional[float] = None,
    new_hospital_lon: Optional[float] = None,
) -> dict:
    bs_q = select(BlackSpot)
    if district:
        bs_q = bs_q.where(BlackSpot.district == district)
    bs_result = await db.execute(bs_q)
    blackspots = bs_result.scalars().all()

    amb_result = await db.execute(
        select(Ambulance).where(
            Ambulance.is_active == True,
            Ambulance.current_lat.isnot(None),
        )
    )
    ambulances = amb_result.scalars().all()

    hypothetical_bases = []
    if new_base_lat and new_base_lon:
        hypothetical_bases.append({"lat": new_base_lat, "lon": new_base_lon})

    gaps = []
    covered = 0
    golden_hour_limit = 60

    for bs in blackspots:
        min_eta = float("inf")
        for amb in ambulances:
            dist = haversine_distance(bs.latitude, bs.longitude, amb.current_lat, amb.current_lon)
            eta = estimate_eta_minutes(dist)
            min_eta = min(min_eta, eta)
        for base in hypothetical_bases:
            dist = haversine_distance(bs.latitude, bs.longitude, base["lat"], base["lon"])
            eta = estimate_eta_minutes(dist)
            min_eta = min(min_eta, eta)

        if min_eta <= golden_hour_limit:
            covered += 1
        else:
            gaps.append({
                "blackspot_id": str(bs.id),
                "name": bs.name,
                "district": bs.district,
                "latitude": bs.latitude,
                "longitude": bs.longitude,
                "min_eta_minutes": round(min_eta, 1),
            })

    total = len(blackspots)
    coverage_pct = round(covered / total * 100, 1) if total > 0 else 0

    return {
        "total_blackspots": total,
        "covered": covered,
        "coverage_pct": coverage_pct,
        "gaps": gaps,
        "recommendation": f"Add ambulance base to cover {len(gaps)} underserved black spots" if gaps else "Coverage is adequate",
    }
