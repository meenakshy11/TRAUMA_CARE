from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.hospital_service import (
    list_hospitals, get_hospital, update_resources, reserve_trauma_slot, recommend_hospital
)
from app.services.notification_service import manager
import uuid

router = APIRouter(prefix="/hospitals", tags=["hospitals"])


class ResourceUpdate(BaseModel):
    icu_beds_total: Optional[int] = None
    icu_beds_available: Optional[int] = None
    ed_capacity_total: Optional[int] = None
    ed_capacity_current: Optional[int] = None
    ventilators_total: Optional[int] = None
    ventilators_available: Optional[int] = None
    ot_available: Optional[bool] = None
    blood_bank_available: Optional[bool] = None
    specialist_on_duty: Optional[bool] = None


class HospitalCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    district: str
    phone: Optional[str] = None
    trauma_level: Optional[str] = None
    is_kasb_empaneled: bool = False
    is_government: bool = False


def serialize_hospital(h) -> dict:
    res = h.resources
    return {
        "id": str(h.id),
        "name": h.name,
        "latitude": h.latitude,
        "longitude": h.longitude,
        "address": h.address,
        "district": h.district,
        "phone": h.phone,
        "trauma_level": h.trauma_level,
        "is_kasb_empaneled": h.is_kasb_empaneled,
        "is_government": h.is_government,
        "is_active": h.is_active,
        "resources": {
            "icu_beds_total": res.icu_beds_total if res else 0,
            "icu_beds_available": res.icu_beds_available if res else 0,
            "ed_capacity_total": res.ed_capacity_total if res else 0,
            "ed_capacity_current": res.ed_capacity_current if res else 0,
            "ventilators_total": res.ventilators_total if res else 0,
            "ventilators_available": res.ventilators_available if res else 0,
            "ot_available": res.ot_available if res else False,
            "blood_bank_available": res.blood_bank_available if res else False,
            "specialist_on_duty": res.specialist_on_duty if res else False,
        } if res else None,
        "created_at": h.created_at.isoformat() if h.created_at else None,
    }


@router.get("")
async def list_all(
    district: Optional[str] = Query(None),
    trauma_level: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hospitals = await list_hospitals(db, district=district, trauma_level=trauma_level)
    return [serialize_hospital(h) for h in hospitals]


@router.get("/recommend")
async def recommend(
    lat: float = Query(...),
    lon: float = Query(...),
    triage_color: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hospital = await recommend_hospital(db, lat, lon, triage_color)
    if not hospital:
        return {"hospital": None}
    return serialize_hospital(hospital)


@router.get("/{hospital_id}")
async def get_one(
    hospital_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hospital = await get_hospital(db, hospital_id)
    if not hospital:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Hospital")
    return serialize_hospital(hospital)


@router.put("/{hospital_id}/resources")
async def update_res(
    hospital_id: uuid.UUID,
    body: ResourceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = await update_resources(
        db, hospital_id, updated_by=current_user.id,
        **body.model_dump(exclude_none=True)
    )
    await db.commit()
    await manager.broadcast_hospital_update(
        str(hospital_id),
        resource.icu_beds_available,
        resource.ed_capacity_current,
    )
    return {"status": "updated", "icu_beds_available": resource.icu_beds_available}


@router.post("/{hospital_id}/slots")
async def create_slot(
    hospital_id: uuid.UUID,
    incident_id: uuid.UUID,
    patient_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    slot = await reserve_trauma_slot(db, hospital_id, incident_id, patient_id)
    await db.commit()
    return {"slot_id": str(slot.id), "status": "reserved"}


@router.post("")
async def create_hospital(
    body: HospitalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.hospital import Hospital, HospitalResource
    from app.core.constants import TraumaLevel
    h = Hospital(
        name=body.name,
        latitude=body.latitude,
        longitude=body.longitude,
        address=body.address,
        district=body.district,
        phone=body.phone,
        trauma_level=TraumaLevel(body.trauma_level) if body.trauma_level else None,
        is_kasb_empaneled=body.is_kasb_empaneled,
        is_government=body.is_government,
    )
    db.add(h)
    await db.flush()
    res = HospitalResource(hospital_id=h.id)
    db.add(res)
    await db.commit()
    await db.refresh(h)
    return serialize_hospital(h)
