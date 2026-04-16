import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as db:
        total = (await db.execute(text("SELECT COUNT(*) FROM ambulances"))).scalar()
        by_type = (await db.execute(text(
            "SELECT ambulance_type, COUNT(*) FROM ambulances WHERE registration_no LIKE 'KL-B%' GROUP BY ambulance_type ORDER BY ambulance_type"
        ))).fetchall()
        by_dist = (await db.execute(text(
            "SELECT district, COUNT(*) FROM ambulances WHERE registration_no LIKE 'KL-B%' GROUP BY district ORDER BY district"
        ))).fetchall()

        print(f"Total ambulances in DB: {total}")
        print()
        print("New ambulances by type:")
        for row in by_type:
            print(f"  {row[0]:10s} : {row[1]}")
        print()
        print("New ambulances by district:")
        for row in by_dist:
            print(f"  {row[0]:28s} : {row[1]}")

asyncio.run(check())
