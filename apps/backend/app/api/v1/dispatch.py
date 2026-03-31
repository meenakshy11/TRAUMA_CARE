from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.dispatch_service import get_dispatch_recommendations, confirm_dispatch
from app.services.notification_service import manager
import uuid

router = APIRouter(prefix="/dispatch", tags=["dispatch"])


class DispatchConfirm(BaseModel):
    incident_id: uuid.UUID
    ambulance_id: uuid.UUID
    hospital_id: Optional[uuid.UUID] = None
    was_auto: bool = False


@router.get("/recommend")
async def recommend(
    incident_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_dispatch_recommendations(db, incident_id)


@router.post("/confirm")
async def confirm(
    body: DispatchConfirm,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = await confirm_dispatch(
        db,
        incident_id=body.incident_id,
        ambulance_id=body.ambulance_id,
        hospital_id=body.hospital_id,
        dispatcher_id=current_user.id,
        was_auto=body.was_auto,
    )
    await db.commit()
    await manager.broadcast_incident_status(
        str(body.incident_id), "DISPATCHED", ""
    )
    return {
        "dispatch_id": str(record.id),
        "status": "dispatched",
        "ambulance_id": str(record.ambulance_id),
    }
