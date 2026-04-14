from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.analytics_service import get_kpi_summary, get_district_performance, get_monthly_trends

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/kpi")
async def kpi(
    district: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_kpi_summary(db, district=district)


@router.get("/district-performance")
async def district_performance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_district_performance(db)


@router.get("/monthly-trends")
async def monthly_trends(
    district: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_monthly_trends(db, district=district)
