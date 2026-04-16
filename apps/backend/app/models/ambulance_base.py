import uuid
from typing import Optional
from sqlalchemy import String, Float, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base


class AmbulanceBase(Base):
    __tablename__ = "ambulance_bases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Identifier from JSON
    base_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    # Display info
    base_name: Mapped[str] = mapped_column(String(255), nullable=False)
    base_address: Mapped[Optional[str]] = mapped_column(String(500))

    # Location
    base_lat: Mapped[float] = mapped_column(Float, nullable=False)
    base_lon: Mapped[float] = mapped_column(Float, nullable=False)

    # Type: hospital | police | fire
    base_type: Mapped[str] = mapped_column(String(50), nullable=False, default="hospital")

    # Timestamps
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[object]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
