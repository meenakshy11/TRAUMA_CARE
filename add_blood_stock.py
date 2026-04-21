import pathlib

#  1. Blood stock model 
model = '''import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import uuid as _uuid

class BloodStock(Base):
    __tablename__ = "blood_stock"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    hospital_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("hospitals.id"), nullable=False)
    blood_group: Mapped[str] = mapped_column(String(5), nullable=False)  # A+, A-, B+, B-, O+, O-, AB+, AB-
    units_available: Mapped[int] = mapped_column(Integer, default=0)
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    hospital = relationship("Hospital", back_populates="blood_stock")
'''
pathlib.Path('apps/backend/app/models/blood_stock.py').write_text(model, encoding='utf-8')
print('blood_stock model: OK')

#  2. Add relationship to Hospital model 
p = pathlib.Path('apps/backend/app/models/hospital.py')
src = p.read_text(encoding='utf-8')
if 'blood_stock' not in src:
    src = src.replace(
        'class Hospital(Base):',
        'class Hospital(Base):'
    )
    # Add relationship at end of model
    src = src.replace(
        '    resources: Mapped[list["HospitalResource"]] = relationship("HospitalResource", back_populates="hospital", uselist=False)',
        '    resources: Mapped[list["HospitalResource"]] = relationship("HospitalResource", back_populates="hospital", uselist=False)\n    blood_stock: Mapped[list["BloodStock"]] = relationship("BloodStock", back_populates="hospital", cascade="all, delete-orphan")'
    )
    p.write_text(src, encoding='utf-8')
    print('hospital model: relationship added')
else:
    print('hospital model: already has blood_stock')

#  3. Add to models __init__ 
p2 = pathlib.Path('apps/backend/app/models/__init__.py')
src2 = p2.read_text(encoding='utf-8')
if 'blood_stock' not in src2:
    src2 += '\nfrom app.models.blood_stock import BloodStock\n'
    p2.write_text(src2, encoding='utf-8')
    print('models __init__: updated')
else:
    print('models __init__: already updated')

#  4. Blood stock service 
service = '''from sqlalchemy.ext.asyncio import AsyncSession
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
'''
pathlib.Path('apps/backend/app/services/blood_stock_service.py').write_text(service, encoding='utf-8')
print('blood_stock service: OK')

#  5. Blood stock API 
api = '''from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.blood_stock_service import get_blood_stock, get_hospitals_with_blood_group, update_blood_stock
import uuid

router = APIRouter(prefix="/blood-stock", tags=["blood-stock"])

@router.get("/search")
async def search_by_blood_group(
    blood_group: str = Query(..., description="e.g. O+, AB-"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Find all hospitals that have a specific blood group available"""
    stocks = await get_hospitals_with_blood_group(db, blood_group)
    return [
        {
            "hospital_id": str(s.hospital_id),
            "blood_group": s.blood_group,
            "units_available": s.units_available,
            "last_updated": s.last_updated.isoformat() if s.last_updated else None,
        }
        for s in stocks
    ]

@router.get("/{hospital_id}")
async def get_hospital_blood_stock(
    hospital_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get blood stock for a specific hospital"""
    stocks = await get_blood_stock(db, hospital_id)
    return [
        {
            "blood_group": s.blood_group,
            "units_available": s.units_available,
            "last_updated": s.last_updated.isoformat() if s.last_updated else None,
        }
        for s in stocks
    ]

@router.put("/{hospital_id}")
async def update_hospital_blood_stock(
    hospital_id: uuid.UUID,
    blood_group: str,
    units: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update blood stock units for a hospital (HOSPITAL_STAFF or ADMIN only)"""
    if current_user.role.value not in ["HOSPITAL_STAFF", "ADMIN"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not authorized")
    stock = await update_blood_stock(db, hospital_id, blood_group, units)
    return {"blood_group": stock.blood_group, "units_available": stock.units_available}
'''
pathlib.Path('apps/backend/app/api/v1/blood_stock.py').write_text(api, encoding='utf-8')
print('blood_stock API: OK')

print('\nAll files created. Next: register router + DB migration')
