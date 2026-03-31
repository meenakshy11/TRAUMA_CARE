import uuid
from typing import Optional
from sqlalchemy import String, Float, Boolean, Enum as SAEnum, ForeignKey, DateTime, func, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
from app.core.constants import AmbulanceStatus, AmbulanceType


class StagingStation(Base):
    __tablename__ = "staging_stations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    district: Mapped[str] = mapped_column(String(100))
    address: Mapped[Optional[str]] = mapped_column(String(500))
    fuel_brand: Mapped[Optional[str]] = mapped_column(String(100))
    capacity: Mapped[int] = mapped_column(Integer, default=5)
    nearby_blackspot_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())

    ambulances: Mapped[list["Ambulance"]] = relationship("Ambulance", back_populates="staging_station")


class Ambulance(Base):
    __tablename__ = "ambulances"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registration_no: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    ambulance_type: Mapped[AmbulanceType] = mapped_column(SAEnum(AmbulanceType), default=AmbulanceType.BLS)
    status: Mapped[AmbulanceStatus] = mapped_column(SAEnum(AmbulanceStatus), default=AmbulanceStatus.AVAILABLE, index=True)
    current_lat: Mapped[Optional[float]] = mapped_column(Float)
    current_lon: Mapped[Optional[float]] = mapped_column(Float)
    last_location_at: Mapped[Optional[object]] = mapped_column(DateTime(timezone=True), nullable=True)
    staging_station_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("staging_stations.id"), nullable=True)
    district: Mapped[str] = mapped_column(String(100), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    device_id: Mapped[Optional[str]] = mapped_column(String(100))
    speed_kmph: Mapped[Optional[float]] = mapped_column(Float)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[object]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    staging_station: Mapped[Optional["StagingStation"]] = relationship("StagingStation", back_populates="ambulances")
    location_history: Mapped[list["AmbulanceLocationHistory"]] = relationship("AmbulanceLocationHistory", back_populates="ambulance")


class AmbulanceLocationHistory(Base):
    __tablename__ = "ambulance_location_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ambulance_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ambulances.id"), nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    speed_kmph: Mapped[Optional[float]] = mapped_column(Float)
    heading: Mapped[Optional[float]] = mapped_column(Float)
    incident_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    recorded_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())

    ambulance: Mapped["Ambulance"] = relationship("Ambulance", back_populates="location_history")
