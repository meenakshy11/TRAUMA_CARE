from fastapi import APIRouter, Depends, Query
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
