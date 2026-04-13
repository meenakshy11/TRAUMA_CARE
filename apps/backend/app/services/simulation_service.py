"""
Simulation Service — Integrated Trauma Care Platform
======================================================
Module 1: distance_calculation      → haversine_distance (in geo_service)
Module 2: nearest_ambulance_service → find_nearest_ambulance()
Module 3: hospital_selection_service→ select_best_hospital()
Module 4: response_time_calculator  → calculate_response_time()
Module 5: coverage_simulator        → get_coverage_heatmap()
Module 6: infrastructure_optimizer  → test_infrastructure_scenario()
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List, Dict, Any
import math

from app.models.ambulance import Ambulance, StagingStation
from app.models.blackspot import BlackSpot
from app.models.hospital import Hospital
from app.services.geo_service import haversine_distance, estimate_eta_minutes
from app.core.constants import AmbulanceStatus, TraumaLevel


# ── Speed constant ────────────────────────────────────────────────────────────
AVG_SPEED_KMPH = 40.0   # average ambulance speed through Kerala roads

# Scene time by severity (minutes a crew spends on scene stabilising patient)
SCENE_TIME_MAP: Dict[str, int] = {
    "CRITICAL": 10,
    "SEVERE":    7,
    "MODERATE":  5,
    "MINOR":     5,
}

GOLDEN_HOUR_LIMIT = 60  # minutes


# ═══════════════════════════════════════════════════════════════════════════════
# MODULE 2 — Nearest Ambulance Finder
# ═══════════════════════════════════════════════════════════════════════════════
async def find_nearest_ambulance(
    db: AsyncSession,
    accident_lat: float,
    accident_lon: float,
    extra_bases: Optional[List[Dict]] = None,   # hypothetical bases [{lat,lon}]
) -> Optional[Dict[str, Any]]:
    """
    Find the ambulance with status=AVAILABLE closest to the accident location.
    Returns a dict with ambulance info + distance, or None if no available unit.
    """
    result = await db.execute(
        select(Ambulance).where(
            Ambulance.is_active == True,
            Ambulance.status == AmbulanceStatus.AVAILABLE,
            Ambulance.current_lat.isnot(None),
            Ambulance.current_lon.isnot(None),
        )
    )
    ambulances = result.scalars().all()

    best = None
    best_dist = float("inf")

    for amb in ambulances:
        dist = haversine_distance(
            accident_lat, accident_lon,
            amb.current_lat, amb.current_lon,
        )
        if dist < best_dist:
            best_dist = dist
            best = {
                "id": str(amb.id),
                "registration_no": amb.registration_no,
                "ambulance_type": amb.ambulance_type.value if amb.ambulance_type else "BLS",
                "district": amb.district,
                "current_lat": amb.current_lat,
                "current_lon": amb.current_lon,
                "distance_km": round(dist, 2),
                "is_hypothetical": False,
            }

    # Also consider hypothetical bases (for infrastructure optimizer)
    if extra_bases:
        for base in extra_bases:
            dist = haversine_distance(
                accident_lat, accident_lon,
                base["lat"], base["lon"],
            )
            if dist < best_dist:
                best_dist = dist
                best = {
                    "id": "hypothetical",
                    "registration_no": "NEW-BASE",
                    "ambulance_type": "ALS",
                    "district": "Hypothetical",
                    "current_lat": base["lat"],
                    "current_lon": base["lon"],
                    "distance_km": round(dist, 2),
                    "is_hypothetical": True,
                }

    return best


# ═══════════════════════════════════════════════════════════════════════════════
# MODULE 3 — Hospital Selection Service
# ═══════════════════════════════════════════════════════════════════════════════
async def select_best_hospital(
    db: AsyncSession,
    accident_lat: float,
    accident_lon: float,
    severity: str = "SEVERE",
) -> Optional[Dict[str, Any]]:
    """
    Select hospital with trauma capability and minimum transport distance.
    For CRITICAL severity, prefer LEVEL_1 hospitals.
    """
    query = select(Hospital).where(
        Hospital.is_active == True,
        Hospital.latitude.isnot(None),
        Hospital.longitude.isnot(None),
    )
    result = await db.execute(query)
    hospitals = result.scalars().all()

    if not hospitals:
        return None

    # Score each hospital: weight by trauma level + distance
    trauma_priority = {
        TraumaLevel.LEVEL_1: 1,
        TraumaLevel.LEVEL_2: 2,
        TraumaLevel.LEVEL_3: 3,
        TraumaLevel.COMMUNITY: 4,
        None: 5,
    }

    best = None
    best_score = float("inf")

    for hosp in hospitals:
        dist = haversine_distance(
            accident_lat, accident_lon,
            hosp.latitude, hosp.longitude,
        )
        level_weight = trauma_priority.get(hosp.trauma_level, 5)
        # For critical cases multiply distance penalty if low trauma level
        if severity == "CRITICAL":
            score = dist + (level_weight - 1) * 5
        else:
            score = dist + (level_weight - 1) * 2

        if score < best_score:
            best_score = score
            best = {
                "id": str(hosp.id),
                "name": hosp.name,
                "district": hosp.district,
                "latitude": hosp.latitude,
                "longitude": hosp.longitude,
                "trauma_level": hosp.trauma_level.value if hosp.trauma_level else "COMMUNITY",
                "is_government": hosp.is_government,
                "distance_km": round(dist, 2),
            }

    return best


# ═══════════════════════════════════════════════════════════════════════════════
# MODULE 4 — Response Time Calculator
# ═══════════════════════════════════════════════════════════════════════════════
def calculate_response_time(
    ambulance_distance_km: float,
    hospital_distance_km: float,
    severity: str = "SEVERE",
) -> Dict[str, Any]:
    """
    Compute:
      dispatch_time  = ambulance_distance / speed * 60          (ambulance → scene)
      scene_time     = based on severity (CRITICAL=10, SEVERE=7, MODERATE=5)
      transport_time = hospital_distance / speed * 60           (scene → hospital)
      total          = dispatch + scene + transport
      golden_hour    = total ≤ 60 min
    """
    dispatch_time  = (ambulance_distance_km / AVG_SPEED_KMPH) * 60
    scene_time     = SCENE_TIME_MAP.get(severity.upper(), 7)
    transport_time = (hospital_distance_km / AVG_SPEED_KMPH) * 60
    total          = dispatch_time + scene_time + transport_time

    return {
        "dispatch_time":       round(dispatch_time, 1),
        "scene_time":          scene_time,
        "transport_time":      round(transport_time, 1),
        "total_response_time": round(total, 1),
        "golden_hour_status":  "Within Golden Hour" if total <= GOLDEN_HOUR_LIMIT else "Exceeds Golden Hour",
        "golden_hour_met":     total <= GOLDEN_HOUR_LIMIT,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# MODULE 5 — Main Accident Simulation Orchestrator
# ═══════════════════════════════════════════════════════════════════════════════
async def run_accident_simulation(
    db: AsyncSession,
    lat: float,
    lon: float,
    severity: str = "SEVERE",
    extra_bases: Optional[List[Dict]] = None,
) -> Dict[str, Any]:
    """
    Main simulation flow:
    1. Find nearest available ambulance
    2. Select best hospital
    3. Calculate response times
    4. Return complete result
    """
    ambulance = await find_nearest_ambulance(db, lat, lon, extra_bases)
    hospital  = await select_best_hospital(db, lat, lon, severity)

    if not ambulance:
        return {
            "error": "No available ambulances found in the system.",
            "nearest_ambulance": None,
        }
    if not hospital:
        return {
            "error": "No active hospitals found in the system.",
            "hospital_selected": None,
        }

    times = calculate_response_time(
        ambulance["distance_km"],
        hospital["distance_km"],
        severity,
    )

    return {
        # Ambulance info
        "nearest_ambulance":  ambulance["registration_no"],
        "ambulance_id":       ambulance["id"],
        "ambulance_type":     ambulance["ambulance_type"],
        "ambulance_distance": ambulance["distance_km"],
        "ambulance_lat":      ambulance["current_lat"],
        "ambulance_lng":      ambulance["current_lon"],
        "is_hypothetical_base": ambulance.get("is_hypothetical", False),
        # Hospital info
        "hospital_selected":  hospital["name"],
        "hospital_id":        hospital["id"],
        "hospital_district":  hospital["district"],
        "hospital_distance":  hospital["distance_km"],
        "hospital_lat":       hospital["latitude"],
        "hospital_lng":       hospital["longitude"],
        "hospital_trauma_level": hospital["trauma_level"],
        # Time breakdown
        "dispatch_time":       times["dispatch_time"],
        "scene_time":          times["scene_time"],
        "transport_time":      times["transport_time"],
        "total_response_time": times["total_response_time"],
        "golden_hour_status":  times["golden_hour_status"],
        "golden_hour_met":     times["golden_hour_met"],
        # Input echo
        "accident_lat": lat,
        "accident_lng": lon,
        "severity": severity,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# MODULE 5 — Coverage Heatmap Generator
# ═══════════════════════════════════════════════════════════════════════════════
async def get_coverage_heatmap(
    db: AsyncSession,
    district: Optional[str] = None,
) -> Dict[str, Any]:
    """
    For each available ambulance, compute reachable radii for 15, 30, 45 minutes.
    Also returns the actual ambulance positions for map display.
    """
    result = await db.execute(
        select(Ambulance).where(
            Ambulance.is_active == True,
            Ambulance.current_lat.isnot(None),
            Ambulance.current_lon.isnot(None),
        )
    )
    ambulances = result.scalars().all()

    coverage_zones = []
    for amb in ambulances:
        if district and amb.district != district:
            continue
        # radius = speed * time / 60  (in km)
        coverage_zones.append({
            "ambulance_id": str(amb.id),
            "registration_no": amb.registration_no,
            "lat": amb.current_lat,
            "lng": amb.current_lon,
            "district": amb.district,
            "status": amb.status.value if amb.status else "AVAILABLE",
            "radius_15min_km": round(AVG_SPEED_KMPH * 15 / 60, 2),   # 10.0 km
            "radius_30min_km": round(AVG_SPEED_KMPH * 30 / 60, 2),   # 20.0 km
            "radius_45min_km": round(AVG_SPEED_KMPH * 45 / 60, 2),   # 30.0 km
        })

    return {
        "coverage_zones": coverage_zones,
        "total_ambulances": len(coverage_zones),
        "district_filter": district,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# MODULE 6 — Infrastructure Optimizer
# ═══════════════════════════════════════════════════════════════════════════════
async def test_infrastructure_scenario(
    db: AsyncSession,
    new_base_lat: float,
    new_base_lon: float,
    district: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Test adding a new ambulance base at (new_base_lat, new_base_lon).
    Compares average response time to all blackspots vs current baseline.
    """
    bs_q = select(BlackSpot)
    if district:
        bs_q = bs_q.where(BlackSpot.district == district)
    bs_result = await db.execute(bs_q)
    blackspots = bs_result.scalars().all()

    result = await db.execute(
        select(Ambulance).where(
            Ambulance.is_active == True,
            Ambulance.current_lat.isnot(None),
        )
    )
    ambulances = result.scalars().all()

    if not blackspots:
        return {"error": "No blackspots found for comparison."}

    # Baseline: best response time per blackspot from current ambulances
    baseline_times = []
    improved_times = []
    improvements = 0

    for bs in blackspots:
        # Current best dispatch time
        min_dist_current = min(
            haversine_distance(bs.latitude, bs.longitude, a.current_lat, a.current_lon)
            for a in ambulances
        ) if ambulances else 9999

        # With new base
        new_base_dist = haversine_distance(bs.latitude, bs.longitude, new_base_lat, new_base_lon)
        min_dist_new  = min(min_dist_current, new_base_dist)

        t_current = (min_dist_current / AVG_SPEED_KMPH) * 60
        t_new     = (min_dist_new / AVG_SPEED_KMPH) * 60

        baseline_times.append(t_current)
        improved_times.append(t_new)
        if t_new < t_current:
            improvements += 1

    avg_baseline = round(sum(baseline_times) / len(baseline_times), 1)
    avg_improved = round(sum(improved_times) / len(improved_times), 1)
    reduction    = round(avg_baseline - avg_improved, 1)

    covered_baseline = sum(1 for t in baseline_times if t <= GOLDEN_HOUR_LIMIT)
    covered_improved = sum(1 for t in improved_times if t <= GOLDEN_HOUR_LIMIT)
    total = len(blackspots)

    return {
        "new_base_lat":      new_base_lat,
        "new_base_lon":      new_base_lon,
        "total_blackspots":  total,
        "avg_dispatch_time_before": avg_baseline,
        "avg_dispatch_time_after":  avg_improved,
        "time_reduction_minutes":   reduction,
        "blackspots_improved":      improvements,
        "coverage_before_pct":  round(covered_baseline / total * 100, 1) if total else 0,
        "coverage_after_pct":   round(covered_improved  / total * 100, 1) if total else 0,
        "coverage_gain_pct":    round((covered_improved - covered_baseline) / total * 100, 1) if total else 0,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Legacy — Blackspot Coverage Gap Analysis (kept for existing /simulation/run)
# ═══════════════════════════════════════════════════════════════════════════════
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
            eta  = estimate_eta_minutes(dist)
            min_eta = min(min_eta, eta)
        for base in hypothetical_bases:
            dist = haversine_distance(bs.latitude, bs.longitude, base["lat"], base["lon"])
            eta  = estimate_eta_minutes(dist)
            min_eta = min(min_eta, eta)

        if min_eta <= golden_hour_limit:
            covered += 1
        else:
            gaps.append({
                "blackspot_id":     str(bs.id),
                "name":             bs.name,
                "district":         bs.district,
                "latitude":         bs.latitude,
                "longitude":        bs.longitude,
                "min_eta_minutes":  round(min_eta, 1),
            })

    total = len(blackspots)
    coverage_pct = round(covered / total * 100, 1) if total > 0 else 0

    return {
        "total_blackspots": total,
        "covered":          covered,
        "coverage_pct":     coverage_pct,
        "gaps":             gaps,
        "recommendation":   f"Add ambulance base to cover {len(gaps)} underserved black spots" if gaps else "Coverage is adequate",
    }
