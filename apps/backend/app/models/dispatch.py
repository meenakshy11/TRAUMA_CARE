import uuid
from typing import Optional
from sqlalchemy import Boolean, ForeignKey, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base


class DispatchRecord(Base):
    __tablename__ = "dispatch_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=False, index=True)
    ambulance_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ambulances.id"), nullable=False)
    dispatcher_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    hospital_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True)
    was_auto: Mapped[bool] = mapped_column(Boolean, default=False)
    dispatched_at: Mapped[Optional[object]] = mapped_column(DateTime(timezone=True), nullable=True)
    scene_arrived_at: Mapped[Optional[object]] = mapped_column(DateTime(timezone=True), nullable=True)
    transport_started_at: Mapped[Optional[object]] = mapped_column(DateTime(timezone=True), nullable=True)
    hospital_arrived_at: Mapped[Optional[object]] = mapped_column(DateTime(timezone=True), nullable=True)
    response_time_sec: Mapped[Optional[int]] = mapped_column(Integer)
    transport_time_sec: Mapped[Optional[int]] = mapped_column(Integer)
    total_time_sec: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())
