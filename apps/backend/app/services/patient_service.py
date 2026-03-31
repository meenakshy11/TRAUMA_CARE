from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional, List
import uuid

from app.models.patient import Patient, VitalSign, TriageRecord, PatientInjury
from app.core.constants import TriageColor, Gender


def calculate_start_triage(
    is_breathing: bool,
    respirations_ok: bool,
    perfusion_ok: bool,
    mental_status_ok: bool,
) -> TriageColor:
    """START protocol triage calculation."""
    if not is_breathing:
        return TriageColor.BLACK
    if not respirations_ok:
        return TriageColor.RED
    if not perfusion_ok:
        return TriageColor.RED
    if not mental_status_ok:
        return TriageColor.RED
    return TriageColor.YELLOW


def calculate_triage_score(gcs: Optional[int], spo2: Optional[float],
                           systolic_bp: Optional[int], rr: Optional[int]) -> int:
    """Returns a 0-10 score based on vitals. Lower = more critical."""
    score = 10
    if gcs is not None:
        if gcs <= 8: score -= 4
        elif gcs <= 12: score -= 2
    if spo2 is not None:
        if spo2 < 90: score -= 3
        elif spo2 < 94: score -= 1
    if systolic_bp is not None:
        if systolic_bp < 90: score -= 2
        elif systolic_bp < 100: score -= 1
    if rr is not None:
        if rr < 10 or rr > 29: score -= 2
    return max(0, score)


async def create_patient(
    db: AsyncSession,
    incident_id: uuid.UUID,
    sequence_no: int = 1,
    name: Optional[str] = None,
    age_estimate: Optional[int] = None,
    gender: str = "UNKNOWN",
    stability_status: Optional[str] = None,
    injury_description: Optional[str] = None,
    notes: Optional[str] = None,
) -> Patient:
    patient = Patient(
        incident_id=incident_id,
        sequence_no=sequence_no,
        name=name,
        age_estimate=age_estimate,
        gender=Gender(gender),
        stability_status=stability_status,
        injury_description=injury_description,
        notes=notes,
    )
    db.add(patient)
    await db.flush()
    return patient


async def record_vitals(
    db: AsyncSession,
    patient_id: uuid.UUID,
    gcs_score: Optional[int] = None,
    systolic_bp: Optional[int] = None,
    diastolic_bp: Optional[int] = None,
    spo2: Optional[float] = None,
    respiratory_rate: Optional[int] = None,
    pulse_rate: Optional[int] = None,
    temperature: Optional[float] = None,
    recorded_by_id: Optional[uuid.UUID] = None,
) -> VitalSign:
    vital = VitalSign(
        patient_id=patient_id,
        gcs_score=gcs_score,
        systolic_bp=systolic_bp,
        diastolic_bp=diastolic_bp,
        spo2=spo2,
        respiratory_rate=respiratory_rate,
        pulse_rate=pulse_rate,
        temperature=temperature,
        recorded_by_id=recorded_by_id,
    )
    db.add(vital)

    # Update patient triage score
    pat_result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = pat_result.scalar_one_or_none()
    if patient:
        patient.triage_score = calculate_triage_score(gcs_score, spo2, systolic_bp, respiratory_rate)

    await db.flush()
    return vital


async def record_triage(
    db: AsyncSession,
    patient_id: uuid.UUID,
    is_breathing: bool,
    respirations_ok: bool,
    perfusion_ok: bool,
    mental_status_ok: bool,
    assessed_by_id: Optional[uuid.UUID] = None,
) -> TriageRecord:
    color = calculate_start_triage(is_breathing, respirations_ok, perfusion_ok, mental_status_ok)

    # Update patient triage color
    pat_result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = pat_result.scalar_one_or_none()
    if patient:
        patient.triage_color = color

    triage = TriageRecord(
        patient_id=patient_id,
        triage_color=color,
        is_breathing=is_breathing,
        respirations_ok=respirations_ok,
        perfusion_ok=perfusion_ok,
        mental_status_ok=mental_status_ok,
        assessed_by_id=assessed_by_id,
    )
    db.add(triage)
    await db.flush()
    return triage


async def add_injury(
    db: AsyncSession,
    patient_id: uuid.UUID,
    body_part: str,
    injury_type: str,
    severity: str,
) -> PatientInjury:
    injury = PatientInjury(
        patient_id=patient_id,
        body_part=body_part,
        injury_type=injury_type,
        severity=severity,
    )
    db.add(injury)
    await db.flush()
    return injury


async def get_patients_for_incident(db: AsyncSession, incident_id: uuid.UUID) -> List[Patient]:
    result = await db.execute(
        select(Patient)
        .options(
            selectinload(Patient.vitals),
            selectinload(Patient.triage_record),
            selectinload(Patient.injuries),
        )
        .where(Patient.incident_id == incident_id)
        .order_by(Patient.sequence_no)
    )
    return result.scalars().all()
