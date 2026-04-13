from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.incident_service import (
    create_incident, get_incident, list_incidents,
    get_active_incidents, update_incident_status
)
from app.services.notification_service import manager
import uuid

router = APIRouter(prefix="/incidents", tags=["incidents"])


class IncidentCreate(BaseModel):
    latitude: float
    longitude: float
    severity: Optional[str] = None
    accident_type: Optional[str] = None
    patient_count: int = 1
    description: Optional[str] = None
    district: Optional[str] = None
    address_text: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None


def serialize_incident(inc) -> dict:
    return {
        "id": str(inc.id),
        "incident_number": inc.incident_number,
        "status": inc.status,
        "severity": inc.severity,
        "accident_type": inc.accident_type,
        "latitude": inc.latitude,
        "longitude": inc.longitude,
        "address_text": inc.address_text,
        "district": inc.district,
        "patient_count": inc.patient_count,
        "description": inc.description,
        "is_mci": inc.is_mci,
        "golden_hour_met": inc.golden_hour_met,
        "dispatched_ambulance_id": str(inc.dispatched_ambulance_id) if inc.dispatched_ambulance_id else None,
        "receiving_hospital_id": str(inc.receiving_hospital_id) if inc.receiving_hospital_id else None,
        "reported_by_id": str(inc.reported_by_id) if inc.reported_by_id else None,
        "created_at": inc.created_at.isoformat() if inc.created_at else None,
        "updated_at": inc.updated_at.isoformat() if inc.updated_at else None,
        "timeline": [
            {
                "id": str(t.id),
                "status": t.status,
                "note": t.note,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in (inc.timeline or [])
        ],
    }


@router.post("")
async def create(
    body: IncidentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = await create_incident(
        db,
        latitude=body.latitude,
        longitude=body.longitude,
        severity=body.severity,
        accident_type=body.accident_type,
        patient_count=body.patient_count,
        description=body.description,
        district=body.district,
        address_text=body.address_text,
        reported_by_id=current_user.id,
    )
    await db.commit()
    data = serialize_incident(incident)
    await manager.broadcast_new_incident(data)
    return data


@router.get("/active")
async def get_active(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    incidents = await get_active_incidents(db)
    return [serialize_incident(i) for i in incidents]


@router.get("")
async def list_all(
    status: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "GOVERNMENT" and getattr(current_user, "district", None) and not district:
        district = current_user.district
    incidents = await list_incidents(db, status=status, district=district, page=page, limit=limit)
    return [serialize_incident(i) for i in incidents]


@router.get("/{incident_id}")
async def get_one(
    incident_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = await get_incident(db, incident_id)
    if not incident:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Incident")
    return serialize_incident(incident)


@router.patch("/{incident_id}/status")
async def update_status(
    incident_id: uuid.UUID,
    body: StatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = await update_incident_status(
        db, incident_id, body.status, actor_id=current_user.id, note=body.note
    )
    if not incident:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Incident")
    await db.commit()
    await manager.broadcast_incident_status(
        str(incident.id), str(incident.status), incident.incident_number
    )
    return serialize_incident(incident)


