"""
db_setup.py -- Create the trauma user/db and seed black spots in one shot.
Run from:  cd apps/backend && python db_setup.py
"""
import asyncio
import json
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import asyncpg
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.db.base import Base
from app.models.blackspot import BlackSpot  # noqa – registers with metadata
from app.core.constants import BlackSpotSeverity

BLACKSPOTS_JSON = Path(__file__).resolve().parent / "kerala_blackspots.json"

PRIORITY_SEVERITY = {
    "1st": BlackSpotSeverity.HIGH,
    "2nd": BlackSpotSeverity.HIGH,
    "3rd": BlackSpotSeverity.MEDIUM,
    "4th": BlackSpotSeverity.LOW,
    "5th": BlackSpotSeverity.LOW,
}
RISK_SCORE = {
    BlackSpotSeverity.HIGH: 9.0,
    BlackSpotSeverity.MEDIUM: 6.0,
    BlackSpotSeverity.LOW: 3.5,
}

SUPERUSER_DSN = "postgresql://postgres:root@localhost:5432/postgres"
TRAUMA_DSN    = "postgresql+asyncpg://trauma:trauma@localhost:5432/trauma_db"


# ── Step 1: ensure trauma user + trauma_db exist ──────────────────────────────
async def ensure_db():
    conn = await asyncpg.connect(SUPERUSER_DSN)
    try:
        role = await conn.fetchrow("SELECT 1 FROM pg_roles WHERE rolname = 'trauma'")
        if role:
            await conn.execute("ALTER ROLE trauma WITH PASSWORD 'trauma'")
            print("  [OK] Reset trauma password -> 'trauma'")
        else:
            await conn.execute("CREATE ROLE trauma WITH LOGIN PASSWORD 'trauma'")
            print("  [OK] Created role: trauma")

        db = await conn.fetchrow("SELECT 1 FROM pg_database WHERE datname = 'trauma_db'")
        if not db:
            await conn.execute("CREATE DATABASE trauma_db OWNER trauma")
            print("  [OK] Created database: trauma_db")
        else:
            await conn.execute("GRANT ALL PRIVILEGES ON DATABASE trauma_db TO trauma")
            print("  [OK] Granted privileges on existing trauma_db")
    finally:
        await conn.close()


# ── Step 2: write the backend .env ────────────────────────────────────────────
def write_env():
    env_path = Path(__file__).resolve().parent / ".env"
    content = (
        "DATABASE_URL=postgresql+asyncpg://trauma:trauma@localhost:5432/trauma_db\n"
        "SECRET_KEY=trauma-kerala-super-secret-key-change-in-production-256bit\n"
        "DEBUG=true\n"
        "REDIS_URL=redis://localhost:6379/0\n"
    )
    env_path.write_text(content, encoding="utf-8")
    print(f"  [OK] Written {env_path}")


# ── Step 3: recreate black_spots table + seed ─────────────────────────────────
def midpoint(start, end):
    return round((start["latitude"] + end["latitude"]) / 2, 6), \
           round((start["longitude"] + end["longitude"]) / 2, 6)


async def recreate_and_seed():
    engine = create_async_engine(TRAUMA_DSN, echo=False)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.execute(text("DROP TABLE IF EXISTS black_spots CASCADE"))
        await conn.run_sync(Base.metadata.create_all)
        print("  [OK] Recreated black_spots table")

    with open(BLACKSPOTS_JSON, encoding="utf-8") as f:
        payload = json.load(f)
    records = payload["black_spots"]

    async with Session() as db:
        for i, rec in enumerate(records, 1):
            coords   = rec.get("coordinates", {})
            start_pt = coords.get("starting_point", {})
            end_pt   = coords.get("ending_point",   {})
            mid_lat, mid_lon = midpoint(start_pt, end_pt)
            road     = rec.get("road", {})
            priority = rec.get("priority", "").strip()
            severity = PRIORITY_SEVERITY.get(priority)

            db.add(BlackSpot(
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
                risk_score=RISK_SCORE.get(severity, 0.0) if severity else 0.0,
                incident_count=0,
                fatality_rate=None,
                accidents_per_year=0,
                description=(
                    f"{rec.get('location','')} -- "
                    f"{road.get('name','')} ({road.get('number','')})"
                ),
            ))
            print(f"  [{i:02d}] {rec['district']:20s} | {priority:5s} | {rec.get('location','')[:50]}")
        await db.commit()

    await engine.dispose()
    print(f"\n  [DONE]  Inserted {len(records)} black spots.")


async def main():
    print("=" * 62)
    print("  Kerala Trauma Platform -- DB Bootstrap + Black Spot Seed")
    print("=" * 62)

    print("\n[1/3] Ensuring DB user & database ...")
    await ensure_db()

    print("\n[2/3] Writing .env file ...")
    write_env()

    print("\n[3/3] Recreating black_spots table & seeding data ...")
    await recreate_and_seed()

    print("\n" + "=" * 62)
    print("  Done! Run the FastAPI backend and the data will be live.")
    print("=" * 62)


if __name__ == "__main__":
    asyncio.run(main())
