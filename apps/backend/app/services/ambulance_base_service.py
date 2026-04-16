from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.models.ambulance_base import AmbulanceBase


async def list_ambulance_bases(db: AsyncSession) -> List[AmbulanceBase]:
    result = await db.execute(select(AmbulanceBase).order_by(AmbulanceBase.base_name.asc()))
    return result.scalars().all()


async def get_ambulance_base(db: AsyncSession, base_id: str) -> Optional[AmbulanceBase]:
    result = await db.execute(
        select(AmbulanceBase).where(AmbulanceBase.base_id == base_id)
    )
    return result.scalar_one_or_none()
