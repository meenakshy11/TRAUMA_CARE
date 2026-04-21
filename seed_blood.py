import asyncio, sys, random
sys.path.insert(0, '/app')
from app.db.session import engine, AsyncSessionLocal
from sqlalchemy import text

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]

async def main():
    # Create table
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS blood_stock (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
                blood_group VARCHAR(5) NOT NULL,
                units_available INTEGER DEFAULT 0,
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(hospital_id, blood_group)
            )
        """))
        print("Table created")

    # Seed blood stock for all hospitals
    async with AsyncSessionLocal() as db:
        hospitals = (await db.execute(text("SELECT id FROM hospitals LIMIT 50"))).fetchall()
        count = 0
        for (hid,) in hospitals:
            for bg in BLOOD_GROUPS:
                units = random.randint(0, 20)
                await db.execute(text("""
                    INSERT INTO blood_stock (hospital_id, blood_group, units_available)
                    VALUES (:hid, :bg, :units)
                    ON CONFLICT (hospital_id, blood_group) DO UPDATE SET units_available = :units
                """), {"hid": str(hid), "bg": bg, "units": units})
                count += 1
        await db.commit()
        print(f"Seeded {count} blood stock records for {len(hospitals)} hospitals")

asyncio.run(main())
