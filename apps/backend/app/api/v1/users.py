from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.services.auth_service import create_user
from app.core.constants import UserRole
import uuid

router = APIRouter(prefix="/users", tags=["users"])


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    phone: Optional[str] = None
    hospital_id: Optional[uuid.UUID] = None
    ambulance_id: Optional[uuid.UUID] = None


def serialize_user(u: User) -> dict:
    return {
        "id": str(u.id),
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role,
        "phone": u.phone,
        "is_active": u.is_active,
        "hospital_id": str(u.hospital_id) if u.hospital_id else None,
        "ambulance_id": str(u.ambulance_id) if u.ambulance_id else None,
    }


@router.get("")
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    result = await db.execute(select(User))
    return [serialize_user(u) for u in result.scalars().all()]


@router.post("")
async def create(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    user = await create_user(
        db, email=body.email, password=body.password,
        full_name=body.full_name, role=UserRole(body.role),
        phone=body.phone, hospital_id=body.hospital_id,
        ambulance_id=body.ambulance_id,
    )
    await db.commit()
    return serialize_user(user)
