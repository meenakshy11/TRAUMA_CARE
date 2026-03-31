from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from app.db.session import get_db
from app.services.auth_service import authenticate_user, generate_tokens, get_user_by_id, update_fcm_token
from app.core.security import decode_token
from app.dependencies import get_current_user
from app.models.user import User
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class FCMTokenRequest(BaseModel):
    fcm_token: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    tokens = generate_tokens(user.id)
    return {
        **tokens,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "phone": user.phone,
            "hospital_id": str(user.hospital_id) if user.hospital_id else None,
            "ambulance_id": str(user.ambulance_id) if user.ambulance_id else None,
            "is_active": user.is_active,
        }
    }


@router.post("/refresh")
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user_id = payload.get("sub")
    user = await get_user_by_id(db, uuid.UUID(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return generate_tokens(user.id)


@router.post("/fcm-token")
async def update_fcm(
    body: FCMTokenRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await update_fcm_token(db, current_user.id, body.fcm_token)
    return {"status": "updated"}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "phone": current_user.phone,
        "hospital_id": str(current_user.hospital_id) if current_user.hospital_id else None,
        "ambulance_id": str(current_user.ambulance_id) if current_user.ambulance_id else None,
        "is_active": current_user.is_active,
    }
