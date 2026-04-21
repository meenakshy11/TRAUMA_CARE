from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.blood_stock import BloodStock
import uuid

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]

async def get_blood_stock(db: AsyncSession, hospital_id: uuid.UUID):
    result = await db.execute(
        select(BloodStock).where(BloodStock.hospital_id == hospital_id)
    )
    return result.scalars().all()

async def get_hospitals_with_blood_group(db: AsyncSession, blood_group: str):
    result = await db.execute(
        select(BloodStock).where(
            BloodStock.blood_group == blood_group,
            BloodStock.units_available > 0
        )
    )
    return result.scalars().all()

async def update_blood_stock(db: AsyncSession, hospital_id: uuid.UUID, blood_group: str, units: int):
    result = await db.execute(
        select(BloodStock).where(
            BloodStock.hospital_id == hospital_id,
            BloodStock.blood_group == blood_group
        )
    )
    stock = result.scalar_one_or_none()
    if stock:
        stock.units_available = units
        from datetime import datetime, timezone
        stock.last_updated = datetime.now(timezone.utc)
    else:
        stock = BloodStock(hospital_id=hospital_id, blood_group=blood_group, units_available=units)
        db.add(stock)
    await db.commit()
    return stock
