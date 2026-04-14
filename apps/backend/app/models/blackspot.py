import uuid
from typing import Optional
from sqlalchemy import String, Float, Integer, Text, Enum as SAEnum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
from app.core.constants import BlackSpotSeverity


class BlackSpot(Base):
    __tablename__ = "black_spots"

    # ── Primary Key ──────────────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ── Administrative info ──────────────────────────────────────────────────
    district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    police_station: Mapped[Optional[str]] = mapped_column(String(255))
    location: Mapped[Optional[str]] = mapped_column(String(512))   # human-readable stretch name
    priority: Mapped[Optional[str]] = mapped_column(String(10))    # "1st" … "5th"

    # ── Road metadata ────────────────────────────────────────────────────────
    road_name: Mapped[Optional[str]] = mapped_column(String(255))
    road_number: Mapped[Optional[str]] = mapped_column(String(50))  # NH-66, SH-1, MDR …
    road_type: Mapped[Optional[str]] = mapped_column(String(20))    # NH, SH, OR
    road_length: Mapped[Optional[str]] = mapped_column(String(50))  # "500M", "5 KM" …

    # ── Midpoint coordinates (used for heatmap / map pin) ────────────────────
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    # ── Segment endpoint coordinates ─────────────────────────────────────────
    start_latitude: Mapped[Optional[float]] = mapped_column(Float)
    start_longitude: Mapped[Optional[float]] = mapped_column(Float)
    end_latitude: Mapped[Optional[float]] = mapped_column(Float)
    end_longitude: Mapped[Optional[float]] = mapped_column(Float)

    # ── Legacy / analytics fields ─────────────────────────────────────────────
    name: Mapped[Optional[str]] = mapped_column(String(255))        # optional display name
    incident_count: Mapped[int] = mapped_column(Integer, default=0)
    fatality_rate: Mapped[Optional[float]] = mapped_column(Float)
    accidents_per_year: Mapped[int] = mapped_column(Integer, default=0)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    severity: Mapped[Optional[BlackSpotSeverity]] = mapped_column(SAEnum(BlackSpotSeverity))
    description: Mapped[Optional[str]] = mapped_column(Text)

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[object]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
