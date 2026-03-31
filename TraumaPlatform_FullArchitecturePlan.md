# Integrated Trauma Care Platform — Full Production Architecture Plan
> **Stack:** Python FastAPI · PostgreSQL · SQLAlchemy · React (Vite + TS) · Android (Kotlin + Jetpack Compose)  
> **Prepared for:** Quantumweave Intelligence Private Limited

---

## Table of Contents
1. [System Overview & Communication Map](#1-system-overview--communication-map)
2. [Backend — FastAPI (Directory + Files)](#2-backend--fastapi)
3. [Database — SQLAlchemy Models](#3-database--sqlalchemy-models)
4. [Full API Reference](#4-full-api-reference)
5. [React Web App — Command Center (Directory + Files)](#5-react-web-app--command-center)
6. [Android App — Field Layer (Directory + Files)](#6-android-app--field-layer)
7. [Inter-Service Communication Flow](#7-inter-service-communication-flow)
8. [Infrastructure & Deployment](#8-infrastructure--deployment)

---

## 1. System Overview & Communication Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INTEGRATED TRAUMA CARE PLATFORM                  │
│                                                                     │
│  [Android App]──────────────────────────────────────────────────┐  │
│  (Paramedic/Driver)   REST + WebSocket + FCM Push               │  │
│                                                                  ▼  │
│  [React Web App]──────►  FastAPI Backend  ◄──────[Hospital HIS] │  │
│  (Command Center)         (Python 3.11)         [Police/Fire]   │  │
│                               │                                  │  │
│                           PostgreSQL                             │  │
│                           + Redis (cache/pubsub)                 │  │
│                           + MinIO (media/photos)                 │  │
│                           + Celery (async tasks)                 │  │
└─────────────────────────────────────────────────────────────────────┘
```

**Roles in the system:**
| Role | Access Layer |
|------|-------------|
| `PARAMEDIC` | Android App + limited API |
| `DISPATCHER` | React Web (Command Center) |
| `HOSPITAL_STAFF` | React Web (Hospital Dashboard) |
| `ADMIN` | React Web (Full Admin) |
| `GOVERNMENT` | React Web (Analytics/Read-only) |
| `PUBLIC` | REST endpoint for citizen reporting |

---

## 2. Backend — FastAPI

### Full Directory Structure

```
trauma-backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py                        # FastAPI app factory, mounts routers, CORS, startup events
│   ├── config.py                      # All env-based settings via pydantic BaseSettings
│   ├── dependencies.py                # Shared FastAPI dependencies (get_db, get_current_user, roles)
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py                    # SQLAlchemy declarative Base
│   │   ├── session.py                 # AsyncSession factory, engine creation
│   │   └── init_db.py                 # DB initialization, seed data on first boot
│   │
│   ├── models/                        # SQLAlchemy ORM models (= DB table definitions)
│   │   ├── __init__.py
│   │   ├── user.py                    # User, Role, Permission
│   │   ├── incident.py                # Incident, IncidentTimeline, IncidentPhoto
│   │   ├── ambulance.py               # Ambulance, AmbulanceLocationHistory, StagingStation
│   │   ├── hospital.py                # Hospital, HospitalResource, TraumaSlot
│   │   ├── patient.py                 # Patient, TriageRecord, VitalSign
│   │   ├── dispatch.py                # DispatchRecord, DispatchRecommendation
│   │   ├── blackspot.py               # BlackSpot, AccidentDensityRecord
│   │   ├── notification.py            # Notification, AlertRule
│   │   └── audit.py                   # AuditLog (all mutations logged)
│   │
│   ├── schemas/                       # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── auth.py                    # LoginRequest, TokenResponse, RegisterRequest
│   │   ├── incident.py                # IncidentCreate, IncidentUpdate, IncidentOut
│   │   ├── ambulance.py               # AmbulanceOut, LocationUpdate, AmbulanceCreate
│   │   ├── hospital.py                # HospitalOut, ResourceUpdate, SlotCreate
│   │   ├── patient.py                 # PatientCreate, TriageCreate, TriageOut
│   │   ├── dispatch.py                # DispatchRequest, DispatchOut, RecommendationOut
│   │   ├── blackspot.py               # BlackSpotCreate, BlackSpotOut
│   │   ├── analytics.py               # KPIResponse, HeatmapData, GoldenHourReport
│   │   └── notification.py            # NotificationOut, AlertRuleCreate
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py              # Aggregates all v1 routers
│   │       ├── auth.py                # POST /auth/login, /auth/refresh, /auth/logout
│   │       ├── users.py               # CRUD users, password reset, role assignment
│   │       ├── incidents.py           # Full incident lifecycle endpoints
│   │       ├── ambulances.py          # Fleet management + live location push
│   │       ├── hospitals.py           # Hospital registry + resource updates
│   │       ├── patients.py            # Patient records + triage
│   │       ├── dispatch.py            # Dispatch engine endpoints
│   │       ├── blackspots.py          # Black spot registry + heatmap data
│   │       ├── analytics.py           # KPIs, golden hour, response time reports
│   │       ├── simulation.py          # Scenario simulation endpoints
│   │       ├── notifications.py       # Alert rules + notification history
│   │       ├── uploads.py             # Photo/media upload (MinIO)
│   │       ├── public.py              # Public citizen reporting (no auth)
│   │       └── websocket.py           # WS endpoints: /ws/track, /ws/command
│   │
│   ├── services/                      # Business logic layer (called by routers)
│   │   ├── __init__.py
│   │   ├── auth_service.py            # JWT creation/validation, password hashing
│   │   ├── incident_service.py        # Incident lifecycle state machine
│   │   ├── ambulance_service.py       # Fleet queries, status transitions
│   │   ├── dispatch_service.py        # Nearest-ambulance algorithm, recommendation engine
│   │   ├── hospital_service.py        # Resource availability checks, slot reservation
│   │   ├── patient_service.py         # Triage scoring (START protocol), patient linking
│   │   ├── blackspot_service.py       # Density calculation, heatmap generation
│   │   ├── analytics_service.py       # KPI computation, golden hour metrics
│   │   ├── simulation_service.py      # Coverage gap analysis, scenario modelling
│   │   ├── notification_service.py    # FCM push + WebSocket broadcast + email
│   │   ├── geo_service.py             # Haversine distance, routing API calls
│   │   └── media_service.py           # MinIO upload/download/presigned URLs
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py                # JWT config, token decode, password utils
│   │   ├── exceptions.py              # Custom HTTPException subclasses
│   │   ├── middleware.py              # Request logging, correlation IDs, rate limiting
│   │   └── constants.py               # Enums: IncidentStatus, AmbulanceStatus, TriageColor
│   │
│   ├── tasks/                         # Celery async workers
│   │   ├── __init__.py
│   │   ├── celery_app.py              # Celery instance + beat schedule
│   │   ├── location_tasks.py          # Batch-insert GPS pings every 10s
│   │   ├── analytics_tasks.py         # Scheduled KPI refresh, heatmap rebuild
│   │   ├── alert_tasks.py             # Check response SLA breaches → alert
│   │   └── sync_tasks.py              # Hospital HIS sync, external API polling
│   │
│   └── tests/
│       ├── conftest.py                # Test DB setup, fixtures, mock auth
│       ├── test_incidents.py
│       ├── test_dispatch.py
│       ├── test_triage.py
│       └── test_analytics.py
│
├── alembic/                           # Database migration tool
│   ├── env.py                         # Alembic env using async SQLAlchemy
│   ├── script.py.mako
│   └── versions/                      # Auto-generated migration files
│       └── 0001_initial_schema.py
│
├── scripts/
│   ├── seed_data.py                   # Populate demo hospitals, ambulances, black spots
│   └── create_superadmin.py           # Bootstrap first admin user
│
├── .env.example                       # All required env vars documented
├── docker-compose.yml                 # Full local stack: app + db + redis + minio + celery
├── Dockerfile
├── requirements.txt
├── alembic.ini
└── pytest.ini
```

---

## 3. Database — SQLAlchemy Models

### `app/db/base.py`
```python
from sqlalchemy.orm import DeclarativeBase
import uuid
from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import UUID

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

---

### `app/models/user.py`
```python
from sqlalchemy import Column, String, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin
import enum

class UserRole(str, enum.Enum):
    PARAMEDIC       = "PARAMEDIC"
    DRIVER          = "DRIVER"
    DISPATCHER      = "DISPATCHER"
    HOSPITAL_STAFF  = "HOSPITAL_STAFF"
    ADMIN           = "ADMIN"
    GOVERNMENT      = "GOVERNMENT"
    PUBLIC          = "PUBLIC"

class User(Base, TimestampMixin):
    __tablename__ = "users"
    email          = Column(String, unique=True, nullable=False, index=True)
    phone          = Column(String, unique=True)
    full_name      = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role           = Column(Enum(UserRole), nullable=False)
    is_active      = Column(Boolean, default=True)
    fcm_token      = Column(String)               # Android push notification token
    hospital_id    = Column(UUID, ForeignKey("hospitals.id"), nullable=True)
    ambulance_id   = Column(UUID, ForeignKey("ambulances.id"), nullable=True)

    hospital  = relationship("Hospital", back_populates="staff")
    ambulance = relationship("Ambulance", back_populates="crew")
```

---

### `app/models/incident.py`
```python
from sqlalchemy import Column, String, Float, Integer, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum
from app.db.base import Base, TimestampMixin

class IncidentStatus(str, enum.Enum):
    REPORTED          = "REPORTED"
    DISPATCH_PENDING  = "DISPATCH_PENDING"
    DISPATCHED        = "DISPATCHED"
    EN_ROUTE          = "EN_ROUTE"
    ON_SCENE          = "ON_SCENE"
    PATIENT_LOADED    = "PATIENT_LOADED"
    TRANSPORTING      = "TRANSPORTING"
    HOSPITAL_ARRIVED  = "HOSPITAL_ARRIVED"
    CLOSED            = "CLOSED"
    CANCELLED         = "CANCELLED"

class IncidentSeverity(str, enum.Enum):
    MINOR    = "MINOR"
    MODERATE = "MODERATE"
    SEVERE   = "SEVERE"
    CRITICAL = "CRITICAL"
    MCI      = "MCI"           # Mass Casualty Incident

class AccidentType(str, enum.Enum):
    ROAD_ACCIDENT   = "ROAD_ACCIDENT"
    FALL            = "FALL"
    ASSAULT         = "ASSAULT"
    CARDIAC         = "CARDIAC"
    BURNS           = "BURNS"
    DROWNING        = "DROWNING"
    INDUSTRIAL      = "INDUSTRIAL"
    OTHER           = "OTHER"

class Incident(Base, TimestampMixin):
    __tablename__ = "incidents"
    incident_number  = Column(String, unique=True, nullable=False, index=True)
    status           = Column(Enum(IncidentStatus), default=IncidentStatus.REPORTED)
    severity         = Column(Enum(IncidentSeverity))
    accident_type    = Column(Enum(AccidentType))
    latitude         = Column(Float, nullable=False)
    longitude        = Column(Float, nullable=False)
    address_text     = Column(String)
    district         = Column(String, index=True)
    patient_count    = Column(Integer, default=1)
    description      = Column(Text)
    is_mci           = Column(Boolean, default=False)
    reported_by_id   = Column(UUID, ForeignKey("users.id"))
    dispatched_ambulance_id = Column(UUID, ForeignKey("ambulances.id"))
    receiving_hospital_id   = Column(UUID, ForeignKey("hospitals.id"))
    golden_hour_met  = Column(Boolean)
    metadata         = Column(JSONB, default={})    # extensible field

    reporter   = relationship("User")
    ambulance  = relationship("Ambulance", back_populates="incidents")
    hospital   = relationship("Hospital", back_populates="incidents")
    patients   = relationship("Patient", back_populates="incident")
    timeline   = relationship("IncidentTimeline", back_populates="incident",
                              order_by="IncidentTimeline.created_at")
    photos     = relationship("IncidentPhoto", back_populates="incident")
    dispatch   = relationship("DispatchRecord", back_populates="incident")

class IncidentTimeline(Base, TimestampMixin):
    __tablename__ = "incident_timelines"
    incident_id = Column(UUID, ForeignKey("incidents.id"), nullable=False, index=True)
    status      = Column(Enum(IncidentStatus), nullable=False)
    note        = Column(Text)
    actor_id    = Column(UUID, ForeignKey("users.id"))
    incident    = relationship("Incident", back_populates="timeline")

class IncidentPhoto(Base, TimestampMixin):
    __tablename__ = "incident_photos"
    incident_id = Column(UUID, ForeignKey("incidents.id"), nullable=False)
    file_key    = Column(String, nullable=False)   # MinIO object key
    uploaded_by = Column(UUID, ForeignKey("users.id"))
    incident    = relationship("Incident", back_populates="photos")
```

---

### `app/models/ambulance.py`
```python
from sqlalchemy import Column, String, Float, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin
import enum

class AmbulanceStatus(str, enum.Enum):
    AVAILABLE   = "AVAILABLE"
    DISPATCHED  = "DISPATCHED"
    ON_SCENE    = "ON_SCENE"
    TRANSPORTING = "TRANSPORTING"
    AT_HOSPITAL = "AT_HOSPITAL"
    OFF_DUTY    = "OFF_DUTY"
    MAINTENANCE = "MAINTENANCE"

class AmbulanceType(str, enum.Enum):
    BLS  = "BLS"    # Basic Life Support
    ALS  = "ALS"    # Advanced Life Support
    NICU = "NICU"   # Neonatal
    MFR  = "MFR"    # Mobile First Responder

class Ambulance(Base, TimestampMixin):
    __tablename__ = "ambulances"
    registration_no  = Column(String, unique=True, nullable=False)
    ambulance_type   = Column(Enum(AmbulanceType), default=AmbulanceType.BLS)
    status           = Column(Enum(AmbulanceStatus), default=AmbulanceStatus.AVAILABLE)
    current_lat      = Column(Float)
    current_lon      = Column(Float)
    last_location_at = Column(String)
    staging_station_id = Column(UUID, ForeignKey("staging_stations.id"), nullable=True)
    district         = Column(String, index=True)
    is_active        = Column(Boolean, default=True)
    device_id        = Column(String)               # GPS hardware ID

    crew      = relationship("User", back_populates="ambulance")
    incidents = relationship("Incident", back_populates="ambulance")
    location_history = relationship("AmbulanceLocationHistory", back_populates="ambulance")
    staging_station  = relationship("StagingStation", back_populates="ambulances")

class AmbulanceLocationHistory(Base, TimestampMixin):
    __tablename__ = "ambulance_location_history"
    ambulance_id = Column(UUID, ForeignKey("ambulances.id"), nullable=False, index=True)
    latitude     = Column(Float, nullable=False)
    longitude    = Column(Float, nullable=False)
    speed_kmph   = Column(Float)
    heading      = Column(Float)
    incident_id  = Column(UUID, ForeignKey("incidents.id"), nullable=True)
    ambulance    = relationship("Ambulance", back_populates="location_history")

class StagingStation(Base, TimestampMixin):
    __tablename__ = "staging_stations"
    name       = Column(String, nullable=False)
    latitude   = Column(Float, nullable=False)
    longitude  = Column(Float, nullable=False)
    district   = Column(String)
    address    = Column(String)
    capacity   = Column(Integer, default=5)
    ambulances = relationship("Ambulance", back_populates="staging_station")
```

---

### `app/models/hospital.py`
```python
from sqlalchemy import Column, String, Float, Integer, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin
import enum

class TraumaLevel(str, enum.Enum):
    LEVEL_1 = "LEVEL_1"   # Comprehensive trauma center
    LEVEL_2 = "LEVEL_2"
    LEVEL_3 = "LEVEL_3"
    COMMUNITY = "COMMUNITY"

class Hospital(Base, TimestampMixin):
    __tablename__ = "hospitals"
    name          = Column(String, nullable=False)
    latitude      = Column(Float, nullable=False)
    longitude     = Column(Float, nullable=False)
    address       = Column(String)
    district      = Column(String, index=True)
    phone         = Column(String)
    trauma_level  = Column(Enum(TraumaLevel))
    is_active     = Column(Boolean, default=True)

    resources  = relationship("HospitalResource", back_populates="hospital",
                              uselist=False)
    staff      = relationship("User", back_populates="hospital")
    incidents  = relationship("Incident", back_populates="hospital")
    slots      = relationship("TraumaSlot", back_populates="hospital")

class HospitalResource(Base, TimestampMixin):
    __tablename__ = "hospital_resources"
    hospital_id        = Column(UUID, ForeignKey("hospitals.id"), unique=True)
    icu_beds_total     = Column(Integer, default=0)
    icu_beds_available = Column(Integer, default=0)
    ed_capacity_total  = Column(Integer, default=0)
    ed_capacity_current = Column(Integer, default=0)
    ventilators_total  = Column(Integer, default=0)
    ventilators_available = Column(Integer, default=0)
    ot_available       = Column(Boolean, default=False)     # Operating Theatre
    blood_bank_available = Column(Boolean, default=False)
    specialist_on_duty = Column(Boolean, default=False)
    last_updated_by    = Column(UUID, ForeignKey("users.id"))
    hospital           = relationship("Hospital", back_populates="resources")

class TraumaSlot(Base, TimestampMixin):
    __tablename__ = "trauma_slots"
    hospital_id  = Column(UUID, ForeignKey("hospitals.id"), nullable=False)
    incident_id  = Column(UUID, ForeignKey("incidents.id"))
    patient_id   = Column(UUID, ForeignKey("patients.id"))
    reserved_at  = Column(String)
    released_at  = Column(String)
    is_active    = Column(Boolean, default=True)
    hospital     = relationship("Hospital", back_populates="slots")
```

---

### `app/models/patient.py`
```python
from sqlalchemy import Column, String, Float, Integer, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin
import enum

class TriageColor(str, enum.Enum):
    BLACK  = "BLACK"   # Deceased / expectant
    RED    = "RED"     # Immediate
    YELLOW = "YELLOW"  # Delayed
    GREEN  = "GREEN"   # Minor

class Gender(str, enum.Enum):
    MALE    = "MALE"
    FEMALE  = "FEMALE"
    UNKNOWN = "UNKNOWN"

class Patient(Base, TimestampMixin):
    __tablename__ = "patients"
    incident_id   = Column(UUID, ForeignKey("incidents.id"), nullable=False, index=True)
    sequence_no   = Column(Integer, default=1)    # Patient #1, #2 in same incident
    age_estimate  = Column(Integer)
    gender        = Column(Enum(Gender), default=Gender.UNKNOWN)
    triage_color  = Column(Enum(TriageColor))
    is_conscious  = Column(Boolean)
    is_breathing  = Column(Boolean)
    injury_description = Column(Text)
    hospital_id   = Column(UUID, ForeignKey("hospitals.id"), nullable=True)

    incident  = relationship("Incident", back_populates="patients")
    vitals    = relationship("VitalSign", back_populates="patient",
                             order_by="VitalSign.created_at")
    triage    = relationship("TriageRecord", back_populates="patient", uselist=False)

class VitalSign(Base, TimestampMixin):
    __tablename__ = "vital_signs"
    patient_id        = Column(UUID, ForeignKey("patients.id"), nullable=False, index=True)
    gcs_score         = Column(Integer)     # Glasgow Coma Scale 3–15
    systolic_bp       = Column(Integer)     # Blood pressure systolic
    diastolic_bp      = Column(Integer)
    spo2              = Column(Float)       # Oxygen saturation %
    respiratory_rate  = Column(Integer)    # breaths per minute
    pulse_rate        = Column(Integer)    # beats per minute
    temperature       = Column(Float)      # Celsius
    recorded_by_id    = Column(UUID, ForeignKey("users.id"))
    patient           = relationship("Patient", back_populates="vitals")

class TriageRecord(Base, TimestampMixin):
    __tablename__ = "triage_records"
    patient_id        = Column(UUID, ForeignKey("patients.id"), unique=True)
    protocol          = Column(String, default="START")
    triage_color      = Column(Enum(TriageColor))
    respirations_ok   = Column(Boolean)
    perfusion_ok      = Column(Boolean)
    mental_status_ok  = Column(Boolean)
    triage_score      = Column(Integer)
    assessed_by_id    = Column(UUID, ForeignKey("users.id"))
    patient           = relationship("Patient", back_populates="triage")
```

---

### `app/models/dispatch.py`
```python
from sqlalchemy import Column, Float, Integer, Boolean, ForeignKey, String
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin

class DispatchRecord(Base, TimestampMixin):
    __tablename__ = "dispatch_records"
    incident_id    = Column(UUID, ForeignKey("incidents.id"), nullable=False, index=True)
    ambulance_id   = Column(UUID, ForeignKey("ambulances.id"), nullable=False)
    dispatcher_id  = Column(UUID, ForeignKey("users.id"))
    was_auto       = Column(Boolean, default=False)   # True = algorithm, False = manual
    dispatched_at  = Column(String)
    scene_arrived_at   = Column(String)
    transport_started_at = Column(String)
    hospital_arrived_at = Column(String)
    response_time_sec  = Column(Integer)    # dispatched_at → scene_arrived_at
    transport_time_sec = Column(Integer)    # transport_started → hospital_arrived
    total_time_sec     = Column(Integer)    # reported → hospital_arrived
    incident   = relationship("Incident", back_populates="dispatch")
    ambulance  = relationship("Ambulance")
```

---

### `app/models/blackspot.py`
```python
from sqlalchemy import Column, String, Float, Integer, Text
from app.db.base import Base, TimestampMixin

class BlackSpot(Base, TimestampMixin):
    __tablename__ = "black_spots"
    name           = Column(String)
    latitude       = Column(Float, nullable=False)
    longitude      = Column(Float, nullable=False)
    district       = Column(String, index=True)
    road_name      = Column(String)
    incident_count = Column(Integer, default=0)
    risk_score     = Column(Float, default=0.0)
    description    = Column(Text)
```

---

## 4. Full API Reference

### Base URL: `/api/v1`

---

### Auth (`/auth`)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | `{email, password}` | Returns `access_token` + `refresh_token` |
| POST | `/auth/refresh` | `{refresh_token}` | Rotates access token |
| POST | `/auth/logout` | — | Blacklists token in Redis |
| POST | `/auth/register` | UserCreate | Creates user (Admin only) |
| POST | `/auth/fcm-token` | `{fcm_token}` | Updates FCM token for push notifications |

---

### Incidents (`/incidents`)
| Method | Path | Body/Params | Description |
|--------|------|-------------|-------------|
| POST | `/incidents` | IncidentCreate | **[PARAMEDIC/PUBLIC]** Create new incident |
| GET | `/incidents` | `?status=&district=&page=&limit=` | List incidents (paginated) |
| GET | `/incidents/{id}` | — | Full incident detail + timeline + patients |
| PATCH | `/incidents/{id}/status` | `{status, note}` | Update lifecycle status |
| POST | `/incidents/{id}/photos` | multipart/form-data | Upload scene photos |
| GET | `/incidents/{id}/photos` | — | List presigned photo URLs |
| POST | `/incidents/{id}/mci` | `{patient_count}` | Escalate to Mass Casualty mode |
| GET | `/incidents/active` | — | All non-closed incidents (for live map) |
| GET | `/incidents/{id}/timeline` | — | Ordered timeline of status changes |
| DELETE | `/incidents/{id}` | — | Soft delete (ADMIN only) |

---

### Ambulances (`/ambulances`)
| Method | Path | Body/Params | Description |
|--------|------|-------------|-------------|
| GET | `/ambulances` | `?status=&district=` | List all ambulances |
| POST | `/ambulances` | AmbulanceCreate | Register new ambulance (ADMIN) |
| GET | `/ambulances/{id}` | — | Full ambulance detail |
| PATCH | `/ambulances/{id}` | AmbulanceUpdate | Update details/status |
| POST | `/ambulances/{id}/location` | `{lat, lon, speed, heading}` | **[DRIVER/PARAMEDIC]** Push live GPS |
| GET | `/ambulances/{id}/location-history` | `?from=&to=` | Location trail |
| GET | `/ambulances/available` | `?lat=&lon=&radius_km=` | Available ambulances near point |
| POST | `/ambulances/{id}/assign-station` | `{station_id}` | Stage ambulance to petrol pump |

---

### Dispatch (`/dispatch`)
| Method | Path | Body/Params | Description |
|--------|------|-------------|-------------|
| GET | `/dispatch/recommend` | `?incident_id=` | **Engine recommendation**: nearest available ambulance + suggested hospital |
| POST | `/dispatch/confirm` | `{incident_id, ambulance_id, hospital_id, is_auto}` | Dispatcher confirms dispatch |
| POST | `/dispatch/override` | `{incident_id, ambulance_id, reason}` | Manual override of recommendation |
| GET | `/dispatch/{id}` | — | Dispatch record detail |
| GET | `/dispatch/active` | — | All currently active dispatches |

**Dispatch Algorithm (inside `dispatch_service.py`):**
1. Get all `AVAILABLE` ambulances in same + neighboring districts
2. Sort by Haversine distance to incident lat/lon
3. Score = distance × ambulance_type_weight (ALS preferred over BLS for SEVERE)
4. Top 3 recommendations returned with ETAs
5. Hospital selection: filter by trauma_level ≥ required_level, sort by distance, check ICU/ED capacity

---

### Hospitals (`/hospitals`)
| Method | Path | Body/Params | Description |
|--------|------|-------------|-------------|
| GET | `/hospitals` | `?district=&trauma_level=` | List hospitals |
| POST | `/hospitals` | HospitalCreate | Register hospital (ADMIN) |
| GET | `/hospitals/{id}` | — | Full hospital + resource detail |
| PUT | `/hospitals/{id}/resources` | ResourceUpdate | **[HOSPITAL_STAFF]** Update beds/ventilators/OT |
| GET | `/hospitals/{id}/slots` | — | Active trauma slots |
| POST | `/hospitals/{id}/slots` | SlotCreate | Reserve slot for incoming patient |
| DELETE | `/hospitals/{id}/slots/{slot_id}` | — | Release slot post-admission |
| GET | `/hospitals/recommend` | `?lat=&lon=&triage_color=` | Nearest capable hospital |

---

### Patients & Triage (`/patients`)
| Method | Path | Body/Params | Description |
|--------|------|-------------|-------------|
| POST | `/incidents/{incident_id}/patients` | PatientCreate | Add patient to incident |
| GET | `/incidents/{incident_id}/patients` | — | All patients for incident |
| POST | `/patients/{id}/vitals` | VitalSignCreate | **[PARAMEDIC]** Record vitals |
| GET | `/patients/{id}/vitals` | — | Vitals history |
| POST | `/patients/{id}/triage` | TriageCreate | Record START triage assessment |
| GET | `/patients/{id}/triage` | — | Triage result + color |
| PATCH | `/patients/{id}` | PatientUpdate | Update patient info |

---

### Black Spots (`/blackspots`)
| Method | Path | Body/Params | Description |
|--------|------|-------------|-------------|
| GET | `/blackspots` | `?district=` | List all black spots |
| POST | `/blackspots` | BlackSpotCreate | Add new black spot (ADMIN) |
| GET | `/blackspots/heatmap` | `?district=&from=&to=` | Aggregated density data for heatmap |
| PUT | `/blackspots/{id}` | BlackSpotUpdate | Update risk score |
| DELETE | `/blackspots/{id}` | — | Remove black spot |

---

### Analytics (`/analytics`)
| Method | Path | Params | Description |
|--------|------|--------|-------------|
| GET | `/analytics/kpi` | `?district=&from=&to=` | Avg response time, golden hour %, incident count |
| GET | `/analytics/golden-hour` | `?district=&month=` | Golden hour compliance per district |
| GET | `/analytics/response-times` | `?from=&to=` | Response time distribution |
| GET | `/analytics/incident-trends` | `?granularity=day\|week\|month` | Incident volume over time |
| GET | `/analytics/coverage-gaps` | `?district=` | Underserved zones based on ambulance coverage |
| GET | `/analytics/hospital-load` | — | Current ED occupancy across hospitals |
| GET | `/analytics/district-performance` | — | District-by-district performance matrix |

---

### Simulation (`/simulation`)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/simulation/run` | `{scenario_type, params}` | Run coverage/response scenario |
| POST | `/simulation/add-base` | `{lat, lon, ambulance_count}` | Simulate adding new ambulance base |
| POST | `/simulation/add-hospital` | `{lat, lon, trauma_level}` | Simulate new trauma center |
| GET | `/simulation/coverage-map` | `?district=` | Current coverage polygon data |

---

### Notifications (`/notifications`)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/notifications` | `?unread=true` | User's notification feed |
| POST | `/notifications/{id}/read` | — | Mark as read |
| GET | `/notifications/alert-rules` | — | Configured alert rules (ADMIN) |
| POST | `/notifications/alert-rules` | AlertRuleCreate | Create new alert rule |
| DELETE | `/notifications/alert-rules/{id}` | — | Remove alert rule |

---

### Public Reporting (`/public`)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/public/report` | `{lat, lon, description, photo_base64?}` | Citizen accident report |

---

### WebSocket Endpoints (`/ws`)
| Path | Auth | Description |
|------|------|-------------|
| `/ws/command` | JWT via query param | Command center: receives ALL live events (incidents, ambulance positions, hospital updates) as JSON frames |
| `/ws/track/{ambulance_id}` | JWT | Track a single ambulance (for hospital staff watching incoming) |
| `/ws/incident/{incident_id}` | JWT | Live updates for one incident (status changes, triage updates) |

**WebSocket Message Types:**
```json
{ "type": "AMBULANCE_LOCATION", "ambulance_id": "...", "lat": 9.97, "lon": 76.27, "status": "EN_ROUTE" }
{ "type": "INCIDENT_STATUS", "incident_id": "...", "status": "ON_SCENE", "timestamp": "..." }
{ "type": "HOSPITAL_UPDATE", "hospital_id": "...", "icu_available": 3, "ed_current": 12 }
{ "type": "NEW_INCIDENT", "incident": {...} }
{ "type": "ALERT", "severity": "HIGH", "message": "Response SLA breach: Incident #TRK-20240312-001" }
```

---

## 5. React Web App — Command Center

### Full Directory Structure

```
trauma-web/
│
├── public/
│   └── index.html
│
├── src/
│   ├── main.tsx                        # React root + providers
│   ├── App.tsx                         # Route definitions (React Router v6)
│   ├── vite-env.d.ts
│   │
│   ├── api/                            # API layer (Axios instances)
│   │   ├── client.ts                   # Axios instance with JWT interceptors, refresh logic
│   │   ├── auth.api.ts                 # Auth endpoints
│   │   ├── incidents.api.ts            # Incident CRUD
│   │   ├── ambulances.api.ts           # Fleet + location
│   │   ├── hospitals.api.ts            # Hospital resources
│   │   ├── patients.api.ts             # Triage + vitals
│   │   ├── dispatch.api.ts             # Dispatch engine
│   │   ├── analytics.api.ts            # KPIs + reports
│   │   ├── blackspots.api.ts           # Black spot registry
│   │   └── notifications.api.ts       # Notification feed
│   │
│   ├── hooks/                          # Custom React hooks
│   │   ├── useAuth.ts                  # Auth context hook
│   │   ├── useWebSocket.ts             # WS connection lifecycle
│   │   ├── useLiveAmbulances.ts        # Subscribes to ambulance position stream
│   │   ├── useLiveIncidents.ts         # Subscribes to new/updated incidents
│   │   ├── useDispatch.ts              # Dispatch workflow state
│   │   └── useMapLayers.ts             # Toggleable map layer state
│   │
│   ├── store/                          # Zustand global state
│   │   ├── authStore.ts                # User session, JWT tokens
│   │   ├── incidentStore.ts            # Active incidents map
│   │   ├── ambulanceStore.ts           # Live ambulance positions
│   │   ├── hospitalStore.ts            # Hospital resource state
│   │   ├── notificationStore.ts        # Unread notifications
│   │   └── mapStore.ts                 # Map layer visibility toggles
│   │
│   ├── pages/
│   │   ├── Login/
│   │   │   ├── LoginPage.tsx           # Auth form
│   │   │   └── LoginPage.module.css
│   │   │
│   │   ├── CommandCenter/
│   │   │   ├── CommandCenterPage.tsx   # Main dispatcher view: map + panels
│   │   │   ├── components/
│   │   │   │   ├── LiveMap.tsx         # Leaflet/MapLibre: ambulances + incidents + hospitals
│   │   │   │   ├── IncidentPanel.tsx   # Sidebar: active incidents list
│   │   │   │   ├── DispatchPanel.tsx   # Confirm/override dispatch modal
│   │   │   │   ├── AmbulancePanel.tsx  # Fleet status cards
│   │   │   │   ├── HospitalPanel.tsx   # Hospital capacity strip
│   │   │   │   ├── AlertBanner.tsx     # Alert notifications bar
│   │   │   │   ├── MapLayerControl.tsx # Toggle: ambulances/black spots/hospitals
│   │   │   │   └── MCIBadge.tsx        # MCI escalation badge
│   │   │   └── CommandCenterPage.module.css
│   │   │
│   │   ├── IncidentDetail/
│   │   │   ├── IncidentDetailPage.tsx  # Full incident view
│   │   │   ├── components/
│   │   │   │   ├── IncidentTimeline.tsx
│   │   │   │   ├── PatientList.tsx
│   │   │   │   ├── TriageCard.tsx
│   │   │   │   ├── VitalSignsChart.tsx # Line chart of GCS/BP/SpO2 over time
│   │   │   │   ├── PhotoGallery.tsx
│   │   │   │   └── DispatchHistory.tsx
│   │   │   └── IncidentDetailPage.module.css
│   │   │
│   │   ├── Hospitals/
│   │   │   ├── HospitalListPage.tsx    # All hospitals with resource status
│   │   │   ├── HospitalDetailPage.tsx  # Single hospital: beds/OT/slots
│   │   │   └── components/
│   │   │       ├── ResourceBar.tsx     # Visual capacity bar (ICU/ED)
│   │   │       ├── TraumaSlotTable.tsx
│   │   │       └── HospitalMap.tsx     # Mini-map locating hospital
│   │   │
│   │   ├── Analytics/
│   │   │   ├── AnalyticsDashboardPage.tsx   # Government/admin view
│   │   │   └── components/
│   │   │       ├── GoldenHourChart.tsx       # Bar: % compliance per district
│   │   │       ├── ResponseTimeHistogram.tsx
│   │   │       ├── IncidentTrendsLine.tsx
│   │   │       ├── DistrictPerformanceTable.tsx
│   │   │       ├── CoverageGapMap.tsx        # Heatmap overlay of underserved zones
│   │   │       └── KPISummaryCards.tsx
│   │   │
│   │   ├── BlackSpots/
│   │   │   ├── BlackSpotPage.tsx       # Registry table + heatmap
│   │   │   └── components/
│   │   │       ├── BlackSpotHeatmap.tsx
│   │   │       └── BlackSpotTable.tsx
│   │   │
│   │   ├── Simulation/
│   │   │   ├── SimulationPage.tsx      # Drop pins, run scenarios
│   │   │   └── components/
│   │   │       ├── SimulationMap.tsx
│   │   │       ├── ScenarioForm.tsx
│   │   │       └── CoverageResultOverlay.tsx
│   │   │
│   │   ├── Admin/
│   │   │   ├── UserManagementPage.tsx  # CRUD users + roles
│   │   │   ├── AmbulanceRegistryPage.tsx
│   │   │   ├── HospitalRegistryPage.tsx
│   │   │   ├── StagingStationPage.tsx
│   │   │   └── AlertRulesPage.tsx
│   │   │
│   │   └── HospitalDashboard/
│   │       ├── HospitalDashboardPage.tsx  # Hospital staff view: incoming + resources
│   │       └── components/
│   │           ├── IncomingAmbulanceCard.tsx   # ETA countdown for incoming patients
│   │           ├── PreArrivalAlertBanner.tsx
│   │           └── ResourceUpdateForm.tsx      # Quick update beds/ventilators
│   │
│   ├── components/                     # Shared UI components
│   │   ├── Layout/
│   │   │   ├── AppShell.tsx            # Sidebar + topbar wrapper
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── ProtectedRoute.tsx          # Role-based route guard
│   │   ├── LoadingSpinner.tsx
│   │   ├── StatusBadge.tsx             # Color-coded incident/ambulance status
│   │   ├── TriageColorBadge.tsx        # RED/YELLOW/GREEN/BLACK badge
│   │   ├── ConfirmModal.tsx
│   │   └── DataTable.tsx               # Generic sortable/filterable table
│   │
│   ├── types/                          # TypeScript interfaces
│   │   ├── incident.types.ts
│   │   ├── ambulance.types.ts
│   │   ├── hospital.types.ts
│   │   ├── patient.types.ts
│   │   ├── dispatch.types.ts
│   │   └── analytics.types.ts
│   │
│   ├── utils/
│   │   ├── date.ts                     # Timestamp formatting, duration calc
│   │   ├── geo.ts                      # Haversine client-side, map bounds
│   │   ├── triage.ts                   # START protocol color logic
│   │   └── constants.ts               # Shared enums, colors, map defaults
│   │
│   └── styles/
│       ├── globals.css
│       └── theme.css                   # Design tokens (colors, spacing)
│
├── .env.example                        # VITE_API_BASE_URL, VITE_WS_URL, VITE_MAP_KEY
├── vite.config.ts
├── tsconfig.json
├── package.json
└── Dockerfile                          # Nginx-based production container
```

---

### Key React Data Flows

**Live Map (Command Center):**
```
WebSocket /ws/command
    │── AMBULANCE_LOCATION → ambulanceStore.updatePosition(id, lat, lon)
    │── NEW_INCIDENT       → incidentStore.addIncident(incident)
    │── INCIDENT_STATUS    → incidentStore.updateStatus(id, status)
    └── HOSPITAL_UPDATE    → hospitalStore.updateResources(id, resources)
                                        │
                                        ▼
                              LiveMap.tsx re-renders markers
```

**Dispatch Flow:**
```
Dispatcher clicks incident → DispatchPanel opens
    → GET /dispatch/recommend?incident_id=X
    → Shows top 3 ambulances (distance + ETA)
    → Dispatcher selects or overrides
    → POST /dispatch/confirm
    → Backend sends FCM push to ambulance driver's Android device
    → WebSocket broadcasts INCIDENT_STATUS=DISPATCHED to all command center clients
```

---

## 6. Android App — Field Layer

### Full Directory Structure (Kotlin + Jetpack Compose)

```
trauma-android/
│
├── app/
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml         # Permissions: LOCATION, CAMERA, INTERNET, FOREGROUND_SERVICE
│           │
│           ├── java/com/quantumweave/trauma/
│           │
│           ├── TraumaApplication.kt        # Hilt Application class, Timber init
│           │
│           ├── di/                         # Dependency Injection (Hilt)
│           │   ├── NetworkModule.kt        # Retrofit + OkHttp with JWT interceptor
│           │   ├── DatabaseModule.kt       # Room DB injection
│           │   ├── RepositoryModule.kt     # Repository bindings
│           │   └── ServiceModule.kt        # FCM, GPS service bindings
│           │
│           ├── data/
│           │   ├── local/
│           │   │   ├── TraumaDatabase.kt   # Room Database definition
│           │   │   ├── dao/
│           │   │   │   ├── IncidentDao.kt          # Offline incident CRUD
│           │   │   │   ├── PatientDao.kt            # Offline patient/triage
│           │   │   │   └── PendingSyncDao.kt        # Queue for offline sync
│           │   │   └── entities/
│           │   │       ├── IncidentEntity.kt
│           │   │       ├── PatientEntity.kt
│           │   │       └── PendingSyncEntity.kt     # Records awaiting server sync
│           │   │
│           │   ├── remote/
│           │   │   ├── api/
│           │   │   │   ├── AuthApi.kt               # Retrofit auth endpoints
│           │   │   │   ├── IncidentApi.kt           # Incident endpoints
│           │   │   │   ├── PatientApi.kt            # Triage + vitals
│           │   │   │   ├── AmbulanceApi.kt          # Location push + status
│           │   │   │   └── HospitalApi.kt           # Hospital lookup
│           │   │   └── dto/                         # Data Transfer Objects (match API schemas)
│           │   │       ├── IncidentDto.kt
│           │   │       ├── PatientDto.kt
│           │   │       ├── TriageDto.kt
│           │   │       └── VitalSignDto.kt
│           │   │
│           │   └── repository/
│           │       ├── AuthRepository.kt            # Login, token storage in DataStore
│           │       ├── IncidentRepository.kt        # Online/offline routing logic
│           │       ├── PatientRepository.kt
│           │       ├── LocationRepository.kt        # Fused Location Provider wrapper
│           │       └── SyncRepository.kt            # Retry queue for offline data
│           │
│           ├── domain/
│           │   ├── model/                           # Business models (separate from DTOs)
│           │   │   ├── Incident.kt
│           │   │   ├── Patient.kt
│           │   │   ├── TriageAssessment.kt
│           │   │   └── VitalSigns.kt
│           │   ├── usecase/
│           │   │   ├── CreateIncidentUseCase.kt     # GPS capture + POST incident
│           │   │   ├── AddPatientUseCase.kt
│           │   │   ├── RecordVitalsUseCase.kt
│           │   │   ├── PerformTriageUseCase.kt      # START protocol logic
│           │   │   ├── UpdateStatusUseCase.kt       # ARRIVED_ON_SCENE, TRANSPORTING etc.
│           │   │   └── SyncOfflineDataUseCase.kt    # Flush pending queue to server
│           │   └── util/
│           │       ├── TriageCalculator.kt          # START protocol: resp/perfusion/GCS → color
│           │       └── GoldenHourTimer.kt           # Countdown from incident creation
│           │
│           ├── ui/
│           │   ├── theme/
│           │   │   ├── Color.kt                     # Material3 color tokens
│           │   │   ├── Type.kt
│           │   │   └── Theme.kt
│           │   │
│           │   ├── navigation/
│           │   │   └── NavGraph.kt                  # Compose NavHost: login → home → incident flow
│           │   │
│           │   ├── screens/
│           │   │   ├── login/
│           │   │   │   ├── LoginScreen.kt
│           │   │   │   └── LoginViewModel.kt
│           │   │   │
│           │   │   ├── home/
│           │   │   │   ├── HomeScreen.kt            # Active incident card OR new incident button
│           │   │   │   └── HomeViewModel.kt
│           │   │   │
│           │   │   ├── newincident/
│           │   │   │   ├── NewIncidentScreen.kt     # GPS auto-fill + accident form
│           │   │   │   ├── NewIncidentViewModel.kt
│           │   │   │   └── components/
│           │   │   │       ├── LocationCard.kt      # Shows captured GPS + map thumbnail
│           │   │   │       ├── AccidentTypeSelector.kt
│           │   │   │       ├── SeveritySelector.kt
│           │   │   │       └── PatientCountStepper.kt
│           │   │   │
│           │   │   ├── triage/
│           │   │   │   ├── TriageScreen.kt          # Per-patient START protocol wizard
│           │   │   │   ├── TriageViewModel.kt
│           │   │   │   └── components/
│           │   │   │       ├── TriageStepCard.kt    # Breathing? → Perfusion? → Mental status?
│           │   │   │       ├── TriageColorResult.kt # Show RED/YELLOW/GREEN/BLACK
│           │   │   │       └── PatientTabRow.kt     # Multi-patient tabs
│           │   │   │
│           │   │   ├── vitals/
│           │   │   │   ├── VitalsScreen.kt          # Input: GCS, BP, SpO2, RR, HR
│           │   │   │   ├── VitalsViewModel.kt
│           │   │   │   └── components/
│           │   │   │       ├── VitalInputRow.kt
│           │   │   │       └── GCSGuideDialog.kt    # Embedded GCS scoring guide
│           │   │   │
│           │   │   ├── incidentstatus/
│           │   │   │   ├── IncidentStatusScreen.kt  # Update: SCENE → LOADING → TRANSPORT
│           │   │   │   └── IncidentStatusViewModel.kt
│           │   │   │
│           │   │   ├── photo/
│           │   │   │   ├── PhotoCaptureScreen.kt    # Camera + upload accident photos
│           │   │   │   └── PhotoCaptureViewModel.kt
│           │   │   │
│           │   │   └── hospital/
│           │   │       ├── HospitalInfoScreen.kt    # Receiving hospital: address + resources
│           │   │       └── HospitalInfoViewModel.kt
│           │   │
│           │   └── components/
│           │       ├── GoldenHourBanner.kt          # Persistent countdown timer
│           │       ├── OfflineBanner.kt             # Shows "OFFLINE — data queued" warning
│           │       ├── IncidentStatusStepper.kt     # Visual step progress bar
│           │       └── TriageColorChip.kt
│           │
│           ├── service/
│           │   ├── LocationForegroundService.kt     # Foreground service: pushes GPS every 10s
│           │   ├── FcmMessagingService.kt           # Firebase: receives dispatch notifications
│           │   └── OfflineSyncWorker.kt             # WorkManager: retry queue when back online
│           │
│           └── util/
│               ├── NetworkMonitor.kt                # ConnectivityManager wrapper (online/offline)
│               ├── DataStore.kt                     # Proto DataStore for tokens + user prefs
│               └── Extensions.kt                    # Kotlin extension utilities
│
├── build.gradle.kts                    # Dependencies: Retrofit, Hilt, Room, Compose, Maps, WorkManager
├── google-services.json                # Firebase config (FCM)
└── proguard-rules.pro
```

---

### Android App — Key Feature Implementations

**Offline-First Incident Reporting:**
```
NewIncidentScreen.kt
    → CreateIncidentUseCase
        → NetworkMonitor.isOnline?
            ├── YES: POST /incidents → update local Room DB
            └── NO:  Save to IncidentEntity (Room) + PendingSyncEntity
                     OfflineSyncWorker triggers when network returns
                     → POST all pending records → delete from queue
```

**GPS Foreground Service (LocationForegroundService.kt):**
```
Starts on DISPATCHED notification received via FCM
    → FusedLocationProvider updates every 10 seconds
    → POST /ambulances/{id}/location with lat/lon/speed/heading
    → Backend stores in AmbulanceLocationHistory
    → Redis pub/sub pushes to WebSocket clients (Command Center LiveMap updates in real-time)
    → Stops when HOSPITAL_ARRIVED status confirmed
```

**FCM Dispatch Notification:**
```
Dispatcher confirms dispatch on Web
    → POST /dispatch/confirm
    → notification_service.py sends FCM to driver's fcm_token
    → FcmMessagingService.kt receives:
        { "type": "DISPATCH", "incident_id": "...", "incident_address": "..." }
    → Shows heads-up notification with deep link into IncidentStatusScreen
    → Starts LocationForegroundService automatically
```

**GoldenHourBanner.kt:**
```
Subscribes to incident.created_at timestamp
Counts up in MM:SS
Color changes: 0–20min = GREEN, 20–45min = YELLOW, 45–60min = ORANGE, >60min = RED
Persists across all screens as a floating bottom banner
```

---

## 7. Inter-Service Communication Flow

```
┌─── ANDROID (Paramedic) ──────────────────────────────────────────────┐
│  1. Paramedic creates incident (GPS auto-captured)                   │
│     POST /incidents → {lat, lon, severity, type, patient_count}     │
│  2. Backend generates incident_number (TRK-YYYYMMDD-XXXX)           │
│  3. Backend WS broadcasts NEW_INCIDENT to Command Center             │
│  4. Backend checks alert rules → sends FCM to nearby available       │
│     ambulances (notification only, not dispatch yet)                 │
└──────────────────────────────────────────────────────────────────────┘
                │
                ▼
┌─── REACT (Command Center) ───────────────────────────────────────────┐
│  5. Dispatcher sees NEW_INCIDENT on live map                         │
│  6. Clicks incident → GET /dispatch/recommend?incident_id=X          │
│  7. Backend dispatch_service.py: runs algorithm → returns top 3     │
│  8. Dispatcher confirms → POST /dispatch/confirm                     │
│  9. Backend: updates Ambulance.status = DISPATCHED                   │
│     WS broadcasts INCIDENT_STATUS + AMBULANCE_LOCATION              │
│  10. FCM push sent to assigned ambulance driver                      │
└──────────────────────────────────────────────────────────────────────┘
                │
                ▼
┌─── ANDROID (Driver) ─────────────────────────────────────────────────┐
│  11. Driver receives FCM dispatch notification                        │
│  12. LocationForegroundService starts → GPS pings every 10s          │
│  13. Paramedic records triage/vitals on scene                        │
│      POST /incidents/{id}/patients + POST /patients/{id}/vitals      │
│  14. Backend: patient_service computes START score → triage color    │
│  15. hospital_service recommends nearest capable hospital            │
│  16. Pre-arrival alert sent to hospital (FCM + WS)                   │
└──────────────────────────────────────────────────────────────────────┘
                │
                ▼
┌─── REACT (Hospital Dashboard) ───────────────────────────────────────┐
│  17. Hospital staff sees IncomingAmbulanceCard with ETA countdown    │
│  18. Pre-arrival triage details (color, vitals, GCS) shown           │
│  19. Staff updates resource availability during/after reception      │
│      PUT /hospitals/{id}/resources                                   │
│  20. Dispatch record closed → golden hour compliance logged          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 8. Infrastructure & Deployment

### `docker-compose.yml` Services

```yaml
services:
  db:           # PostgreSQL 16 — primary data store
  redis:        # Redis 7 — WS pub/sub, caching, Celery broker
  minio:        # MinIO — S3-compatible object store for photos
  backend:      # FastAPI (uvicorn workers) — port 8000
  celery:       # Celery worker — async tasks (analytics, alerts, GPS batch)
  celery-beat:  # Celery Beat — scheduled jobs (hourly heatmap rebuild, daily reports)
  nginx:        # Reverse proxy + TLS termination
  web:          # React app (nginx static serve) — port 80/443
```

### Environment Variables (`.env`)

```env
# Database
DATABASE_URL=postgresql+asyncpg://trauma:password@db:5432/trauma_db

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
SECRET_KEY=<256-bit-random>
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Firebase (FCM)
FIREBASE_CREDENTIALS_JSON=/secrets/firebase.json

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET=trauma-media

# Routing API (for traffic-aware routing)
ORS_API_KEY=...   # OpenRouteService (free) or HERE/Google

# App
CORS_ORIGINS=https://commandcenter.trauma.kerala.gov.in
```

### Alembic Migration Workflow

```bash
# Create new migration after model changes
alembic revision --autogenerate -m "add_ventilator_field"

# Apply migrations
alembic upgrade head

# Rollback one version
alembic downgrade -1
```

### Production Checklist

| Item | Tool |
|------|------|
| HTTPS / TLS | Nginx + Let's Encrypt |
| Database backups | pg_dump + S3 daily cron |
| APM / tracing | Sentry (Python + React + Android SDKs) |
| Metrics | Prometheus + Grafana |
| Log aggregation | Loki or ELK |
| Rate limiting | slowapi (FastAPI middleware) |
| API versioning | `/api/v1/` prefix (easy v2 migration) |
| Android CI/CD | GitHub Actions → signed APK → Play Store |
| Web CI/CD | GitHub Actions → Docker build → deploy |

---

## Summary: File Communication Map

```
Android App                  FastAPI Backend              React Web App
─────────────                ─────────────────            ──────────────
IncidentApi.kt     ──POST──► api/v1/incidents.py         incidents.api.ts
PatientApi.kt      ──POST──► api/v1/patients.py          patients.api.ts
AmbulanceApi.kt    ──POST──► api/v1/ambulances.py        ambulances.api.ts
LocationService.kt ──POST──► api/v1/ambulances.py        (WS receives result)
FcmService.kt      ◄─FCM───  tasks/alert_tasks.py        (dispatches push)
                             │
                             ├── services/dispatch_service.py  (algorithm)
                             ├── services/patient_service.py   (START triage)
                             ├── services/notification_service.py (FCM+WS)
                             ├── db/session.py                  (PostgreSQL)
                             └── tasks/celery_app.py            (Redis)
                                          │
                             api/v1/websocket.py ──WS──► useWebSocket.ts
                                                          useLiveAmbulances.ts
                                                          useLiveIncidents.ts
                                                          LiveMap.tsx
```
