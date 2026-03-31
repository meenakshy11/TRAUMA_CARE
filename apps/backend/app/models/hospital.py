import uuid
from typing import Optional
from sqlalchemy import String, Float, Integer, Boolean, Enum as SAEnum, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
from app.core.constants import TraumaLevel


class Hospital(Base):
    __tablename__ = "hospitals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(500))
    district: Mapped[str] = mapped_column(String(100), index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    trauma_level: Mapped[Optional[TraumaLevel]] = mapped_column(SAEnum(TraumaLevel))
    is_kasb_empaneled: Mapped[bool] = mapped_column(Boolean, default=False)
    is_government: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[object]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    resources: Mapped[Optional["HospitalResource"]] = relationship("HospitalResource", back_populates="hospital", uselist=False, cascade="all, delete-orphan")
    slots: Mapped[list["TraumaSlot"]] = relationship("TraumaSlot", back_populates="hospital")


class HospitalResource(Base):
    __tablename__ = "hospital_resources"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hospitals.id"), unique=True, nullable=False)
    icu_beds_total: Mapped[int] = mapped_column(Integer, default=0)
    icu_beds_available: Mapped[int] = mapped_column(Integer, default=0)
    ed_capacity_total: Mapped[int] = mapped_column(Integer, default=0)
    ed_capacity_current: Mapped[int] = mapped_column(Integer, default=0)
    ventilators_total: Mapped[int] = mapped_column(Integer, default=0)
    ventilators_available: Mapped[int] = mapped_column(Integer, default=0)
    ot_available: Mapped[bool] = mapped_column(Boolean, default=False)
    blood_bank_available: Mapped[bool] = mapped_column(Boolean, default=False)
    specialist_on_duty: Mapped[bool] = mapped_column(Boolean, default=False)
    last_updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_at: Mapped[Optional[object]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    hospital: Mapped["Hospital"] = relationship("Hospital", back_populates="resources")


class TraumaSlot(Base):
    __tablename__ = "trauma_slots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=False)
    incident_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=True)
    patient_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())
    released_at: Mapped[Optional[object]] = mapped_column(DateTime(timezone=True), nullable=True)

    hospital: Mapped["Hospital"] = relationship("Hospital", back_populates="slots")
