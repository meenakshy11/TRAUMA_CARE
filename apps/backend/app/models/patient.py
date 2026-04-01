import uuid
from typing import Optional
from sqlalchemy import Integer, Boolean, Enum as SAEnum, ForeignKey, Text, Float, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
from app.core.constants import TriageColor, Gender


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=False, index=True)
    sequence_no: Mapped[int] = mapped_column(Integer, default=1)
    name: Mapped[Optional[str]] = mapped_column(String(255))
    age_estimate: Mapped[Optional[int]] = mapped_column(Integer)
    gender: Mapped[Gender] = mapped_column(SAEnum(Gender), default=Gender.UNKNOWN)
    triage_color: Mapped[Optional[TriageColor]] = mapped_column(SAEnum(TriageColor))
    stability_status: Mapped[Optional[str]] = mapped_column(String(50))
    is_conscious: Mapped[Optional[bool]] = mapped_column(Boolean)
    is_breathing: Mapped[Optional[bool]] = mapped_column(Boolean)
    injury_description: Mapped[Optional[str]] = mapped_column(Text)
    hospital_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True)
    triage_score: Mapped[Optional[int]] = mapped_column(Integer)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[object]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    incident: Mapped["Incident"] = relationship("Incident", back_populates="patients")
    vitals: Mapped[list["VitalSign"]] = relationship("VitalSign", back_populates="patient", order_by="VitalSign.created_at")
    triage_record: Mapped[Optional["TriageRecord"]] = relationship("TriageRecord", back_populates="patient", uselist=False)
    injuries: Mapped[list["PatientInjury"]] = relationship("PatientInjury", back_populates="patient")


class VitalSign(Base):
    __tablename__ = "vital_signs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    gcs_score: Mapped[Optional[int]] = mapped_column(Integer)
    systolic_bp: Mapped[Optional[int]] = mapped_column(Integer)
    diastolic_bp: Mapped[Optional[int]] = mapped_column(Integer)
    spo2: Mapped[Optional[float]] = mapped_column(Float)
    respiratory_rate: Mapped[Optional[int]] = mapped_column(Integer)
    pulse_rate: Mapped[Optional[int]] = mapped_column(Integer)
    temperature: Mapped[Optional[float]] = mapped_column(Float)
    recorded_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())

    patient: Mapped["Patient"] = relationship("Patient", back_populates="vitals")


class TriageRecord(Base):
    __tablename__ = "triage_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id"), unique=True, nullable=False)
    protocol: Mapped[str] = mapped_column(String(20), default="START")
    triage_color: Mapped[Optional[TriageColor]] = mapped_column(SAEnum(TriageColor))
    is_breathing: Mapped[Optional[bool]] = mapped_column(Boolean)
    respirations_ok: Mapped[Optional[bool]] = mapped_column(Boolean)
    perfusion_ok: Mapped[Optional[bool]] = mapped_column(Boolean)
    mental_status_ok: Mapped[Optional[bool]] = mapped_column(Boolean)
    triage_score: Mapped[Optional[int]] = mapped_column(Integer)
    assessed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())

    patient: Mapped["Patient"] = relationship("Patient", back_populates="triage_record")


class PatientInjury(Base):
    __tablename__ = "patient_injuries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    body_part: Mapped[str] = mapped_column(String(100))
    injury_type: Mapped[str] = mapped_column(String(100))
    severity: Mapped[str] = mapped_column(String(50))
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())

    patient: Mapped["Patient"] = relationship("Patient", back_populates="injuries")
