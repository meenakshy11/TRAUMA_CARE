from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.models.user import User
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.constants import UserRole
import uuid


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


async def create_user(db: AsyncSession, email: str, password: str, full_name: str,
                      role: UserRole, phone: Optional[str] = None,
                      hospital_id: Optional[uuid.UUID] = None,
                      ambulance_id: Optional[uuid.UUID] = None) -> User:
    user = User(
        email=email,
        full_name=full_name,
        hashed_password=get_password_hash(password),
        role=role,
        phone=phone,
        hospital_id=hospital_id,
        ambulance_id=ambulance_id,
    )
    db.add(user)
    await db.flush()
    return user


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def update_fcm_token(db: AsyncSession, user_id: uuid.UUID, fcm_token: str) -> None:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        user.fcm_token = fcm_token
        await db.flush()


def generate_tokens(user_id: uuid.UUID) -> dict:
    return {
        "access_token": create_access_token(str(user_id)),
        "refresh_token": create_refresh_token(str(user_id)),
        "token_type": "bearer",
        "expires_in": 3600,
    }
