"""
Seed realistic demo incidents into the running DB.
Run: docker compose exec backend python scripts/seed_incidents.py
"""
import asyncio
import sys
import uuid
from datetime import datetime, timedelta, timezone

sys.path.insert(0, "/app")

from app.db.session import AsyncSessionLocal
from app.models.incident import Incident, IncidentTimeline
from app.core.constants import IncidentStatus, IncidentSeverity, AccidentType
from sqlalchemy import select, func

# ── Demo incidents (mirrors the DEMO_INCIDENTS fixture + many more) ────────────
INCIDENTS = [
    # Active / in-progress
    dict(num="TRK-2024-001", status=IncidentStatus.EN_ROUTE,          severity=IncidentSeverity.CRITICAL,
         atype=AccidentType.ROAD_ACCIDENT, lat=9.5916,  lon=76.5222, district="Kottayam",
         patients=2, desc="Multi-vehicle collision on MC Road, 2 trapped", mins_ago=52),
    dict(num="TRK-2024-002", status=IncidentStatus.ON_SCENE,           severity=IncidentSeverity.SEVERE,
         atype=AccidentType.FALL,          lat=10.5276, lon=76.2144, district="Thrissur",
         patients=1, desc="Construction worker fell from scaffolding, head injury", mins_ago=35),
    dict(num="TRK-2024-003", status=IncidentStatus.REPORTED,           severity=IncidentSeverity.MODERATE,
         atype=AccidentType.CARDIAC,       lat=8.5241,  lon=76.9366, district="Thiruvananthapuram",
         patients=1, desc="55yo male, chest pain radiating to left arm", mins_ago=8),
    dict(num="TRK-2024-004", status=IncidentStatus.HOSPITAL_ARRIVED,   severity=IncidentSeverity.SEVERE,
         atype=AccidentType.ROAD_ACCIDENT, lat=11.2500, lon=75.7800, district="Kozhikode",
         patients=3, desc="Bus vs auto-rickshaw collision near Beach Road junction", mins_ago=130),
    dict(num="TRK-2024-005", status=IncidentStatus.DISPATCH_PENDING,   severity=IncidentSeverity.CRITICAL,
         atype=AccidentType.BURNS,         lat=9.6000,  lon=76.5100, district="Kottayam",
         patients=1, desc="LPG cylinder explosion, 40% burns", mins_ago=18),
    # More active
    dict(num="TRK-2024-006", status=IncidentStatus.DISPATCHED,        severity=IncidentSeverity.SEVERE,
         atype=AccidentType.ROAD_ACCIDENT, lat=9.9312,  lon=76.2673, district="Ernakulam",
         patients=2, desc="Two-wheeler vs truck collision on NH 544", mins_ago=12),
    dict(num="TRK-2024-007", status=IncidentStatus.EN_ROUTE,          severity=IncidentSeverity.MODERATE,
         atype=AccidentType.ASSAULT,       lat=11.8745, lon=75.3704, district="Kannur",
         patients=1, desc="Alleged assault, laceration wounds on head and arms", mins_ago=22),
    dict(num="TRK-2024-008", status=IncidentStatus.ON_SCENE,          severity=IncidentSeverity.CRITICAL,
         atype=AccidentType.DROWNING,      lat=9.4981,  lon=76.3388, district="Alappuzha",
         patients=1, desc="Tourist drowning incident at Vembanad Lake", mins_ago=40),
    dict(num="TRK-2024-009", status=IncidentStatus.REPORTED,          severity=IncidentSeverity.MINOR,
         atype=AccidentType.FALL,          lat=10.7867, lon=76.6548, district="Palakkad",
         patients=1, desc="Elderly woman fall, suspected hip fracture", mins_ago=5),
    dict(num="TRK-2024-010", status=IncidentStatus.TRANSPORTING,      severity=IncidentSeverity.SEVERE,
         atype=AccidentType.ROAD_ACCIDENT, lat=11.5145, lon=76.0530, district="Wayanad",
         patients=2, desc="Head-on collision on Calicut-Mysore Highway, ghat section", mins_ago=65),
    # Closed / resolved
    dict(num="TRK-2024-011", status=IncidentStatus.CLOSED,            severity=IncidentSeverity.MODERATE,
         atype=AccidentType.CARDIAC,       lat=8.8800,  lon=76.6000, district="Kollam",
         patients=1, desc="Cardiac arrest, CPR performed, patient stabilised", mins_ago=180),
    dict(num="TRK-2024-012", status=IncidentStatus.CLOSED,            severity=IncidentSeverity.MINOR,
         atype=AccidentType.ROAD_ACCIDENT, lat=9.2648,  lon=76.7870, district="Pathanamthitta",
         patients=1, desc="Minor road accident, superficial injuries only", mins_ago=240),
    dict(num="TRK-2024-013", status=IncidentStatus.CLOSED,            severity=IncidentSeverity.SEVERE,
         atype=AccidentType.INDUSTRIAL,    lat=10.0159, lon=76.3419, district="Ernakulam",
         patients=3, desc="Industrial accident at CSEZ — machinery entrapment", mins_ago=300),
    dict(num="TRK-2024-014", status=IncidentStatus.CLOSED,            severity=IncidentSeverity.CRITICAL,
         atype=AccidentType.ROAD_ACCIDENT, lat=12.4996, lon=74.9981, district="Kasaragod",
         patients=4, desc="Four-vehicle pile-up on NH 66, critical extrication", mins_ago=420),
    dict(num="TRK-2024-015", status=IncidentStatus.CLOSED,            severity=IncidentSeverity.MODERATE,
         atype=AccidentType.BURNS,         lat=10.5276, lon=76.2144, district="Thrissur",
         patients=1, desc="Kitchen fire burns, ~15% TBSA", mins_ago=360),
    dict(num="TRK-2024-016", status=IncidentStatus.HOSPITAL_ARRIVED,  severity=IncidentSeverity.SEVERE,
         atype=AccidentType.ROAD_ACCIDENT, lat=9.5800,  lon=76.5100, district="Kottayam",
         patients=2, desc="Collision at Kanjirappally junction", mins_ago=95),
    dict(num="TRK-2024-017", status=IncidentStatus.TRANSPORTING,      severity=IncidentSeverity.CRITICAL,
         atype=AccidentType.CARDIAC,       lat=11.2588, lon=75.7804, district="Kozhikode",
         patients=1, desc="STEMI — cath lab pre-alert activated", mins_ago=28),
    dict(num="TRK-2024-018", status=IncidentStatus.CLOSED,            severity=IncidentSeverity.MINOR,
         atype=AccidentType.FALL,          lat=8.5076,  lon=76.9621, district="Thiruvananthapuram",
         patients=1, desc="Child fall from play equipment, arm fracture", mins_ago=500),
    dict(num="TRK-2024-019", status=IncidentStatus.REPORTED,          severity=IncidentSeverity.SEVERE,
         atype=AccidentType.OTHER,         lat=10.3300, lon=76.2500, district="Thrissur",
         patients=2, desc="Snake bite — two farmworkers, anti-venom required", mins_ago=3),
    dict(num="TRK-2024-020", status=IncidentStatus.DISPATCHED,        severity=IncidentSeverity.MODERATE,
         atype=AccidentType.ROAD_ACCIDENT, lat=11.1296, lon=76.0057, district="Malappuram",
         patients=1, desc="Two-wheeler fall, road rash and possible fracture", mins_ago=15),
]


async def main():
    async with AsyncSessionLocal() as db:
        # Check existing count
        result = await db.execute(select(func.count()).select_from(Incident))
        existing = result.scalar()
        if existing and existing > 0:
            print(f"  {existing} incidents already exist — adding only new ones.")

        existing_nums_res = await db.execute(select(Incident.incident_number))
        existing_nums = {r[0] for r in existing_nums_res.fetchall()}

        added = 0
        for inc in INCIDENTS:
            if inc["num"] in existing_nums:
                print(f"  [skip] {inc['num']}")
                continue

            created_at = datetime.now(timezone.utc) - timedelta(minutes=inc["mins_ago"])
            obj = Incident(
                incident_number=inc["num"],
                status=inc["status"],
                severity=inc["severity"],
                accident_type=inc["atype"],
                latitude=inc["lat"],
                longitude=inc["lon"],
                district=inc["district"],
                patient_count=inc["patients"],
                description=inc["desc"],
                is_mci=inc["patients"] >= 3,
                golden_hour_met=True if inc["status"] == IncidentStatus.CLOSED else None,
            )
            # Override created_at via direct attribute so it reflects realistic timing
            db.add(obj)
            await db.flush()

            # Add initial timeline entry
            tl = IncidentTimeline(
                incident_id=obj.id,
                status=IncidentStatus.REPORTED,
                note="Incident reported via emergency line",
            )
            db.add(tl)

            # Add status-progress timeline entries for advanced statuses
            progress_map = {
                IncidentStatus.DISPATCH_PENDING: [IncidentStatus.REPORTED],
                IncidentStatus.DISPATCHED:       [IncidentStatus.REPORTED, IncidentStatus.DISPATCH_PENDING],
                IncidentStatus.EN_ROUTE:         [IncidentStatus.REPORTED, IncidentStatus.DISPATCH_PENDING, IncidentStatus.DISPATCHED],
                IncidentStatus.ON_SCENE:         [IncidentStatus.REPORTED, IncidentStatus.DISPATCH_PENDING, IncidentStatus.DISPATCHED, IncidentStatus.EN_ROUTE],
                IncidentStatus.TRANSPORTING:     [IncidentStatus.REPORTED, IncidentStatus.DISPATCH_PENDING, IncidentStatus.DISPATCHED, IncidentStatus.EN_ROUTE, IncidentStatus.ON_SCENE, IncidentStatus.PATIENT_LOADED],
                IncidentStatus.HOSPITAL_ARRIVED: [IncidentStatus.REPORTED, IncidentStatus.DISPATCH_PENDING, IncidentStatus.DISPATCHED, IncidentStatus.EN_ROUTE, IncidentStatus.ON_SCENE, IncidentStatus.PATIENT_LOADED, IncidentStatus.TRANSPORTING],
                IncidentStatus.CLOSED:           [IncidentStatus.REPORTED, IncidentStatus.DISPATCH_PENDING, IncidentStatus.DISPATCHED, IncidentStatus.EN_ROUTE, IncidentStatus.ON_SCENE, IncidentStatus.PATIENT_LOADED, IncidentStatus.TRANSPORTING, IncidentStatus.HOSPITAL_ARRIVED],
            }
            for extra_status in progress_map.get(inc["status"], []):
                if extra_status == IncidentStatus.REPORTED:
                    continue  # already added above
                extra_tl = IncidentTimeline(
                    incident_id=obj.id,
                    status=extra_status,
                    note=f"Status updated to {extra_status.value.replace('_', ' ').title()}",
                )
                db.add(extra_tl)

            print(f"  [created] {inc['num']} — {inc['district']} ({inc['status'].value})")
            added += 1

        await db.commit()
    print(f"\nDone. {added} incidents added.")


if __name__ == "__main__":
    asyncio.run(main())
