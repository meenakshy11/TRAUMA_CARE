"""
Insert the 4 demo login-page accounts into the running DB.
Run once: docker compose exec backend python scripts/seed_demo_users.py
"""
import asyncio
import sys
import os

# Make sure app package is importable
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


async def main():
    async with AsyncSessionLocal() as db:
        # Get first hospital id for the hospital staff demo user
        result = await db.execute(select(Hospital).limit(1))
        first_hospital = result.scalar_one_or_none()
        first_hospital_id = first_hospital.id if first_hospital else None

        hospital_demo = dict(
            email="hospital@trauma.demo", password="Hosp@1234",
            full_name="Dr. Sreeja Nair",  role=UserRole.HOSPITAL_STAFF,
            hospital_id=first_hospital_id,
        )

        all_users = DEMO_USERS + [hospital_demo]

        for u in all_users:
            existing = await get_user_by_email(db, u["email"])
            if existing:
                print(f"  [skip] {u['email']} already exists")
            else:
                await create_user(db, **u)
                print(f"  [created] {u['email']}")

        await db.commit()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
