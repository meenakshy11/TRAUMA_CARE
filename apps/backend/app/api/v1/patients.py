from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.patient_service import (
    create_patient, record_vitals, record_triage,
    add_injury, get_patients_for_incident
)
import uuid

router = APIRouter(tags=["patients"])


class PatientCreate(BaseModel):
    sequence_no: int = 1
    name: Optional[str] = None
    age_estimate: Optional[int] = None
    gender: str = "UNKNOWN"
    stability_status: Optional[str] = None
    injury_description: Optional[str] = None
    notes: Optional[str] = None


class VitalCreate(BaseModel):
    gcs_score: Optional[int] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    spo2: Optional[float] = None
    respiratory_rate: Optional[int] = None
    pulse_rate: Optional[int] = None
    temperature: Optional[float] = None


class TriageCreate(BaseModel):
    is_breathing: bool
    respirations_ok: bool
    perfusion_ok: bool
    mental_status_ok: bool


class InjuryCreate(BaseModel):
    body_part: str
    injury_type: str
    severity: str


def serialize_patient(p) -> dict:
    return {
        "id": str(p.id),
        "incident_id": str(p.incident_id),
        "sequence_no": p.sequence_no,
        "name": p.name,
        "age_estimate": p.age_estimate,
        "gender": p.gender,
        "triage_color": p.triage_color,
        "stability_status": p.stability_status,
        "triage_score": p.triage_score,
        "injury_description": p.injury_description,
        "notes": p.notes,
        "injuries": [
            {"body_part": i.body_part, "injury_type": i.injury_type, "severity": i.severity}
            for i in (p.injuries or [])
        ],
        "vitals": [
            {
                "id": str(v.id),
                "gcs_score": v.gcs_score,
                "systolic_bp": v.systolic_bp,
                "diastolic_bp": v.diastolic_bp,
                "spo2": v.spo2,
                "respiratory_rate": v.respiratory_rate,
                "pulse_rate": v.pulse_rate,
                "temperature": v.temperature,
                "created_at": v.created_at.isoformat() if v.created_at else None,
            }
            for v in (p.vitals or [])
        ],
        "triage_record": {
            "triage_color": p.triage_record.triage_color,
            "protocol": p.triage_record.protocol,
            "is_breathing": p.triage_record.is_breathing,
            "respirations_ok": p.triage_record.respirations_ok,
            "perfusion_ok": p.triage_record.perfusion_ok,
            "mental_status_ok": p.triage_record.mental_status_ok,
        } if p.triage_record else None,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


@router.post("/incidents/{incident_id}/patients")
async def add_patient(
    incident_id: uuid.UUID,
    body: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = await create_patient(db, incident_id=incident_id, **body.model_dump())
    await db.commit()
    patients = await get_patients_for_incident(db, incident_id)
    return [serialize_patient(p) for p in patients]


@router.get("/incidents/{incident_id}/patients")
async def list_patients(
    incident_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patients = await get_patients_for_incident(db, incident_id)
    return [serialize_patient(p) for p in patients]


@router.post("/patients/{patient_id}/vitals")
async def add_vitals(
    patient_id: uuid.UUID,
    body: VitalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vital = await record_vitals(db, patient_id=patient_id,
                                recorded_by_id=current_user.id, **body.model_dump())
    await db.commit()
    return {"id": str(vital.id), "status": "recorded"}


@router.post("/patients/{patient_id}/triage")
async def add_triage(
    patient_id: uuid.UUID,
    body: TriageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    triage = await record_triage(db, patient_id=patient_id,
                                 assessed_by_id=current_user.id, **body.model_dump())
    await db.commit()
    return {
        "triage_color": triage.triage_color,
        "protocol": triage.protocol,
    }


@router.post("/patients/{patient_id}/injuries")
async def add_patient_injury(
    patient_id: uuid.UUID,
    body: InjuryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    injury = await add_injury(db, patient_id, body.body_part, body.injury_type, body.severity)
    await db.commit()
    return {"id": str(injury.id), "status": "added"}
