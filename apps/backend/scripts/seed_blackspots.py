"""
seed_blackspots.py
──────────────────
Drops and recreates the black_spots table, then seeds all 32 Kerala black spot
records from kerala_blackspots.json.

Usage:
    cd apps/backend
    python seed_blackspots.py

Requirements:
    • kerala_blackspots.json must be in apps/backend/
    • .env (or env vars) must be set so app.config.settings.DATABASE_URL is valid

Priority → Severity mapping:
    1st / 2nd → HIGH
    3rd       → MEDIUM
    4th / 5th → LOW

Latitude/longitude stored on the row = midpoint of the segment (average of
start and end coordinates) so heatmap markers land in the middle of the road
stretch rather than at just one endpoint.
"""

import asyncio
import json
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# ── Bootstrap app path ────────────────────────────────────────────────────────
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db.session import AsyncSessionLocal, engine
from app.db.base import Base
from app.models.blackspot import BlackSpot          # noqa: F401 – needed for metadata
from app.core.constants import BlackSpotSeverity

BLACKSPOTS_JSON = Path(__file__).resolve().parent / "kerala_blackspots.json"

# Map JSON priority strings → BlackSpotSeverity enum
_SEVERITY_MAP: dict[str, BlackSpotSeverity] = {
    "1st": BlackSpotSeverity.HIGH,
    "2nd": BlackSpotSeverity.HIGH,
    "3rd": BlackSpotSeverity.MEDIUM,
    "4th": BlackSpotSeverity.LOW,
    "5th": BlackSpotSeverity.LOW,
}

# Risk score by severity (can be refined later with real incident data)
_RISK_SCORE_MAP: dict[BlackSpotSeverity, float] = {
    BlackSpotSeverity.HIGH:   9.0,
    BlackSpotSeverity.MEDIUM: 6.0,
    BlackSpotSeverity.LOW:    3.5,
}


def _midpoint(start: dict, end: dict) -> tuple[float, float]:
    """Return the average lat/lon of two coordinate dicts."""
    lat = (start["latitude"] + end["latitude"]) / 2
    lon = (start["longitude"] + end["longitude"]) / 2
    return round(lat, 6), round(lon, 6)


async def recreate_table() -> None:
    """Drop and recreate the black_spots table using the current ORM model."""
    async with engine.begin() as conn:
        # Drop table if it exists (cascade removes dependent objects)
        await conn.execute(text("DROP TABLE IF EXISTS black_spots CASCADE"))
        print("  [OK] Dropped existing black_spots table (if any)")

        # Recreate from the ORM metadata
        await conn.run_sync(Base.metadata.create_all)
        print("  [OK] Recreated black_spots table with updated schema")


async def seed(db: AsyncSession) -> None:
    if not BLACKSPOTS_JSON.exists():
        raise FileNotFoundError(f"Not found: {BLACKSPOTS_JSON}")

    with open(BLACKSPOTS_JSON, "r", encoding="utf-8") as f:
        payload = json.load(f)

    records = payload["black_spots"]
    print(f"\nSeeding {len(records)} black spot records …\n")

    for i, rec in enumerate(records, start=1):
        coords   = rec.get("coordinates", {})
        start_pt = coords.get("starting_point", {})
        end_pt   = coords.get("ending_point", {})

        mid_lat, mid_lon = _midpoint(start_pt, end_pt)

        road     = rec.get("road", {})
        priority = rec.get("priority", "").strip()
        severity = _SEVERITY_MAP.get(priority)

        bs = BlackSpot(
            district=rec["district"],
            police_station=rec.get("police_station"),
            location=rec.get("location"),
            priority=priority,
            road_name=road.get("name"),
            road_number=road.get("number"),
            road_type=road.get("type"),
            road_length=road.get("length"),
            latitude=mid_lat,
            longitude=mid_lon,
            start_latitude=start_pt.get("latitude"),
            start_longitude=start_pt.get("longitude"),
            end_latitude=end_pt.get("latitude"),
            end_longitude=end_pt.get("longitude"),
            severity=severity,
            risk_score=_RISK_SCORE_MAP.get(severity, 0.0) if severity else 0.0,
            # Statistics default to 0 — update from real incident data later
            incident_count=0,
            fatality_rate=None,
            accidents_per_year=0,
            description=f"{rec.get('location', '')} — {road.get('name', '')} ({road.get('number', '')})",
        )
        db.add(bs)
        print(f"  [{i:02d}] {rec['district']:20s} | {priority:5s} | {rec.get('location', '')[:50]}")

    await db.commit()
    print(f"\n[DONE] Inserted {len(records)} black spots.")


async def main() -> None:
    print("=" * 60)
    print("  Kerala Black Spots — DB Seed Script")
    print("=" * 60)

    # Step 1 — recreate table
    await recreate_table()

    # Step 2 — seed data
    async with AsyncSessionLocal() as db:
        await seed(db)

    await engine.dispose()
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
