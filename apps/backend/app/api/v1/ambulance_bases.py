from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import require_roles
from app.core.constants import UserRole
from app.services.ambulance_base_service import list_ambulance_bases, get_ambulance_base
from fastapi import HTTPException

router = APIRouter(prefix="/ambulance-bases", tags=["ambulance-bases"])

# Only ADMIN and DISPATCHER can access this endpoint
_authorized = require_roles(UserRole.ADMIN, UserRole.DISPATCHER)


def _serialize(b) -> dict:
    return {
        "id": str(b.id),
        "base_id": b.base_id,
        "base_name": b.base_name,
        "base_address": b.base_address,
        "base_lat": b.base_lat,
        "base_lon": b.base_lon,
        "base_type": b.base_type,
        "created_at": b.created_at.isoformat() if b.created_at else None,
    }


@router.get("")
async def get_all_bases(
    db: AsyncSession = Depends(get_db),
    _=Depends(_authorized),
):
    bases = await list_ambulance_bases(db)
    return [_serialize(b) for b in bases]


@router.get("/{base_id}")
async def get_base(
    base_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(_authorized),
):
    base = await get_ambulance_base(db, base_id)
    if not base:
        raise HTTPException(status_code=404, detail="Ambulance base not found")
    return _serialize(base)
