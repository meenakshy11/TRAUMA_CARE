import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import uuid as _uuid

class BloodStock(Base):
    __tablename__ = "blood_stock"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    hospital_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("hospitals.id"), nullable=False)
    blood_group: Mapped[str] = mapped_column(String(5), nullable=False)  # A+, A-, B+, B-, O+, O-, AB+, AB-
    units_available: Mapped[int] = mapped_column(Integer, default=0)
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    hospital = relationship("Hospital")
