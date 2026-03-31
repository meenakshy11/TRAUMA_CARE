import uuid
from typing import Optional
from sqlalchemy import String, Float, Integer, Boolean, Enum as SAEnum, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base
from app.core.constants import IncidentStatus, IncidentSeverity, AccidentType


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    status: Mapped[IncidentStatus] = mapped_column(SAEnum(IncidentStatus), default=IncidentStatus.REPORTED, index=True)
    severity: Mapped[Optional[IncidentSeverity]] = mapped_column(SAEnum(IncidentSeverity))
    accident_type: Mapped[Optional[AccidentType]] = mapped_column(SAEnum(AccidentType))
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    address_text: Mapped[Optional[str]] = mapped_column(String(500))
    district: Mapped[Optional[str]] = mapped_column(String(100), index=True)
    patient_count: Mapped[int] = mapped_column(Integer, default=1)
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_mci: Mapped[bool] = mapped_column(Boolean, default=False)
    reported_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    dispatched_ambulance_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("ambulances.id"), nullable=True)
    receiving_hospital_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True)
    golden_hour_met: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    meta: Mapped[Optional[dict]] = mapped_column(JSONB, default={})
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[object]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    timeline: Mapped[list["IncidentTimeline"]] = relationship("IncidentTimeline", back_populates="incident", order_by="IncidentTimeline.created_at")
    photos: Mapped[list["IncidentPhoto"]] = relationship("IncidentPhoto", back_populates="incident")
    patients: Mapped[list["Patient"]] = relationship("Patient", back_populates="incident")


class IncidentTimeline(Base):
    __tablename__ = "incident_timelines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=False, index=True)
    status: Mapped[IncidentStatus] = mapped_column(SAEnum(IncidentStatus), nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text)
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())

    incident: Mapped["Incident"] = relationship("Incident", back_populates="timeline")


class IncidentPhoto(Base):
    __tablename__ = "incident_photos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=False)
    file_key: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())

    incident: Mapped["Incident"] = relationship("Incident", back_populates="photos")
