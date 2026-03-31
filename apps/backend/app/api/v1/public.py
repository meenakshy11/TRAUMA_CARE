from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.services.incident_service import create_incident
from app.services.notification_service import manager

router = APIRouter(prefix="/public", tags=["public"])


class PublicReport(BaseModel):
    latitude: float
    longitude: float
    description: Optional[str] = None
    district: Optional[str] = None
    address_text: Optional[str] = None


@router.post("/report")
async def public_report(body: PublicReport, db: AsyncSession = Depends(get_db)):
    incident = await create_incident(
        db,
        latitude=body.latitude,
        longitude=body.longitude,
        severity="MODERATE",
        accident_type="ROAD_ACCIDENT",
        patient_count=1,
        description=body.description,
        district=body.district,
        address_text=body.address_text,
    )
    await db.commit()
    return {
        "incident_number": incident.incident_number,
        "status": "reported",
        "message": "Your report has been received. Help is on the way.",
    }
