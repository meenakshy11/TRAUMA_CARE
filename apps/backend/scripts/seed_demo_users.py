"""
Insert demo login-page accounts into the running DB.
Run once: docker compose exec backend python scripts/seed_demo_users.py
"""
import asyncio
import sys

sys.path.insert(0, "/app")

from app.db.session import AsyncSessionLocal
from app.services.auth_service import create_user, get_user_by_email
from app.core.constants import UserRole
from sqlalchemy import select
from app.models.hospital import Hospital


DEMO_USERS = [
    dict(email="dispatcher@trauma.demo", password="Demo@1234",
         full_name="Arun Krishnan",    role=UserRole.DISPATCHER),
    dict(email="admin@trauma.demo",     password="Admin@1234",
         full_name="Priya Menon",       role=UserRole.ADMIN),
    dict(email="gov@trauma.demo",       password="Gov@1234",
         full_name="Suresh Kumar IAS",  role=UserRole.GOVERNMENT),
]

# Maps email → (full_name, hospital_name_prefix)
HOSPITAL_STAFF_USERS = [
    ("hospital.kottayam@trauma.demo",  "Dr. Sreeja Nair",   "Medical College Hospital Kottayam"),
    ("hospital.tvm@trauma.demo",       "Dr. Anitha Pillai", "SAT Hospital"),
    ("hospital.kozhikode@trauma.demo", "Dr. Rajan Kutty",   "Government Medical College Kozhikode"),
    ("hospital.thrissur@trauma.demo",  "Dr. Mary Thomas",   "Jubilee Mission"),
    # Legacy alias — still works
    ("hospital@trauma.demo",           "Dr. Sreeja Nair",   "Medical College Hospital Kottayam"),
]


async def main():
    async with AsyncSessionLocal() as db:
        # Fetch all hospitals so we can link by name
        result = await db.execute(select(Hospital))
        hospitals = result.scalars().all()
        hospital_map = {h.name: h.id for h in hospitals}

        def find_hospital_id(name_fragment: str):
            for name, hid in hospital_map.items():
                if name_fragment.lower() in name.lower():
                    return hid
            # Fallback: first hospital
            return hospitals[0].id if hospitals else None

        # Seed generic demo users
        for u in DEMO_USERS:
            existing = await get_user_by_email(db, u["email"])
            if existing:
                print(f"  [skip] {u['email']} already exists")
            else:
                await create_user(db, **u)
                print(f"  [created] {u['email']}")

        # Seed hospital staff users
        for email, full_name, hospital_fragment in HOSPITAL_STAFF_USERS:
            hospital_id = find_hospital_id(hospital_fragment)
            existing = await get_user_by_email(db, email)
            if existing:
                print(f"  [skip] {email} already exists")
            else:
                await create_user(
                    db,
                    email=email,
                    password="Hosp@1234",
                    full_name=full_name,
                    role=UserRole.HOSPITAL_STAFF,
                    hospital_id=hospital_id,
                )
                print(f"  [created] {email} → hospital_id={hospital_id}")

        await db.commit()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
