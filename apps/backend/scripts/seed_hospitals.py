"""
seed_hospitals.py
─────────────────
Run once from apps/backend/ to bulk-insert all hospitals from the JSON file.
It is SAFE to run multiple times — it checks for existing records by name+district
and skips duplicates.

Usage:
    cd apps/backend
    python seed_hospitals.py

Requirements:
    • kerala_hospitals_geocoded.json must be in apps/backend/
    • .env (or env vars) must be set so app.config.settings.DATABASE_URL is valid
"""

import asyncio
import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# ── Bootstrap app path ────────────────────────────────────────────────────────
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db.session import AsyncSessionLocal, engine
from app.db.base import Base
from app.models.hospital import Hospital, HospitalResource
from app.core.constants import TraumaLevel

HOSPITALS_JSON = Path(__file__).resolve().parent / "kerala_hospitals_geocoded.json"

_TRAUMA_MAP = {
    "LEVEL_1": TraumaLevel.LEVEL_1,
    "LEVEL_2": TraumaLevel.LEVEL_2,
    "LEVEL_3": TraumaLevel.LEVEL_3,
}


async def seed(db: AsyncSession) -> None:
    if not HOSPITALS_JSON.exists():
        raise FileNotFoundError(f"Not found: {HOSPITALS_JSON}")

    with open(HOSPITALS_JSON, "r", encoding="utf-8") as f:
        records = json.load(f)

    print(f"Processing {len(records)} hospital records …")

    inserted = skipped = 0

    for rec in records:
        # ── duplicate check ──────────────────────────────────────────────────
        result = await db.execute(
            select(Hospital).where(
                Hospital.name == rec["name"],
                Hospital.district == rec["district"],
            )
        )
        if result.scalar_one_or_none():
            skipped += 1
            continue

        # ── insert hospital ──────────────────────────────────────────────────
        h = Hospital(
            name=rec["name"],
            latitude=rec["latitude"],
            longitude=rec["longitude"],
            address=rec.get("address"),
            district=rec["district"],
            phone=rec.get("phone"),
            trauma_level=_TRAUMA_MAP.get(rec.get("trauma_level")),
            is_kasb_empaneled=rec.get("is_kasb_empaneled", False),
            is_government=rec.get("is_government", False),
            is_active=True,
        )
        db.add(h)
        await db.flush()          # get h.id before inserting resource

        # ── insert resource ──────────────────────────────────────────────────
        r = rec.get("resources", {})
        res = HospitalResource(
            hospital_id=h.id,
            icu_beds_total=r.get("icu_total", 0),
            icu_beds_available=r.get("icu_avail", 0),
            ed_capacity_total=r.get("ed_total", 0),
            ed_capacity_current=r.get("ed_current", 0),
            ventilators_total=r.get("vent_total", 0),
            ventilators_available=r.get("vent_avail", 0),
            ot_available=r.get("ot", False),
            blood_bank_available=r.get("blood_bank", False),
            specialist_on_duty=False,
        )
        db.add(res)
        inserted += 1

        # commit in batches of 50 to avoid huge transactions
        if inserted % 50 == 0:
            await db.commit()
            print(f"  … {inserted} inserted so far")

    await db.commit()
    print(f"\nDone. Inserted: {inserted}  |  Skipped (already exist): {skipped}")


async def main() -> None:
    # ensure tables exist (harmless if already created)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        await seed(db)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())