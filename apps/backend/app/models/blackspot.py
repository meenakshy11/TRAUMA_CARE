import uuid
from typing import Optional
from sqlalchemy import String, Float, Integer, Text, Enum as SAEnum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
from app.core.constants import BlackSpotSeverity


class BlackSpot(Base):
    __tablename__ = "black_spots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[Optional[str]] = mapped_column(String(255))
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    district: Mapped[str] = mapped_column(String(100), index=True)
    road_name: Mapped[Optional[str]] = mapped_column(String(255))
    incident_count: Mapped[int] = mapped_column(Integer, default=0)
    fatality_rate: Mapped[Optional[float]] = mapped_column(Float)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    severity: Mapped[Optional[BlackSpotSeverity]] = mapped_column(SAEnum(BlackSpotSeverity))
    description: Mapped[Optional[str]] = mapped_column(Text)
    accidents_per_year: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[object]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
