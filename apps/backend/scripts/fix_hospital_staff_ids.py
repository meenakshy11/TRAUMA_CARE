"""Fix hospital_id for hospital staff demo users — link by exact hospital name fragment."""
import asyncio
import sys
sys.path.insert(0, "/app")

from app.db.session import AsyncSessionLocal
from sqlalchemy import text


# Maps staff email -> exact hospital name fragment that exists in the DB
ASSIGNMENTS = [
    ("hospital.kottayam@trauma.demo",  "CARITAS HOSPITAL KOTTAYAM"),
    ("hospital.tvm@trauma.demo",       "JUBILEE MEMORIAL HOSPITAL PALAYAM"),
    ("hospital.kozhikode@trauma.demo", "KOZHIKODE DISTRICT CO-OPERATIVE HOSPITAL"),
    ("hospital.thrissur@trauma.demo",  "JUBILEE MISSION MEDICAL COLLEGE THRISSUR"),
    ("hospital@trauma.demo",           "CARITAS HOSPITAL KOTTAYAM"),
]


async def main():
    async with AsyncSessionLocal() as db:
        for email, name_fragment in ASSIGNMENTS:
            r = await db.execute(
                text("SELECT id, name FROM hospitals WHERE name ILIKE :frag LIMIT 1"),
                {"frag": f"%{name_fragment}%"},
            )
            row = r.first()
            if row:
                hospital_id, hospital_name = row[0], row[1]
                await db.execute(
                    text("UPDATE users SET hospital_id = :hid WHERE email = :email"),
                    {"hid": hospital_id, "email": email},
                )
                print(f"  {email}  ->  '{hospital_name}'  ->  {hospital_id}")
            else:
                print(f"  [warn] No hospital found matching '{name_fragment}'")
        await db.commit()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
