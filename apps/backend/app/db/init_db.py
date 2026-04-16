import json
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.services.auth_service import create_user, get_user_by_email
from app.core.constants import (
    UserRole, TraumaLevel, AmbulanceType, AmbulanceStatus,
    BlackSpotSeverity, IncidentStatus, IncidentSeverity, AccidentType,
)
from app.models.hospital import Hospital, HospitalResource
from app.models.ambulance import Ambulance, StagingStation
from app.models.blackspot import BlackSpot
from app.models.incident import Incident

# JSON files sit at apps/backend/
_BACKEND_DIR   = Path(__file__).resolve().parent.parent.parent
HOSPITALS_JSON = _BACKEND_DIR / "kerala_hospitals_geocoded.json"
AMBULANCES_JSON= _BACKEND_DIR / "kerala_ambulances_50.json"
BLACKSPOTS_JSON= _BACKEND_DIR / "kerala_blackspots.json"

_TRAUMA_LEVEL_MAP = {
    "LEVEL_1": TraumaLevel.LEVEL_1,
    "LEVEL_2": TraumaLevel.LEVEL_2,
    "LEVEL_3": TraumaLevel.LEVEL_3,
}

_SEVERITY_MAP = {
    "1st": BlackSpotSeverity.HIGH,
    "2nd": BlackSpotSeverity.HIGH,
    "3rd": BlackSpotSeverity.MEDIUM,
    "4th": BlackSpotSeverity.LOW,
    "5th": BlackSpotSeverity.LOW,
}

_RISK_SCORE_MAP = {
    BlackSpotSeverity.HIGH:   9.0,
    BlackSpotSeverity.MEDIUM: 6.0,
    BlackSpotSeverity.LOW:    3.5,
}


async def init_db(db: AsyncSession):
    """Seed initial data if DB is empty."""

    existing = await get_user_by_email(db, "admin@trauma.kerala.gov.in")
    if existing:
        return

    print("Seeding initial data...")

    # ── Users ──────────────────────────────────────────────────────────────────
    admin = await create_user(
        db, email="admin@trauma.kerala.gov.in",
        password="Admin@1234", full_name="System Administrator", role=UserRole.ADMIN,
    )
    await create_user(
        db, email="dispatcher@trauma.kerala.gov.in",
        password="Dispatch@1234", full_name="Arun Krishnan", role=UserRole.DISPATCHER,
    )
    await create_user(
        db, email="gov@trauma.kerala.gov.in",
        password="Gov@1234", full_name="Anitha Nair", role=UserRole.GOVERNMENT,
    )
    await create_user(
        db, email="dispatcher@trauma.demo",
        password="Demo@1234", full_name="Arun Krishnan", role=UserRole.DISPATCHER,
    )
    await create_user(
        db, email="admin@trauma.demo",
        password="Admin@1234", full_name="Priya Menon", role=UserRole.ADMIN,
    )
    await create_user(
        db, email="gov@trauma.demo",
        password="Gov@1234", full_name="Suresh Kumar IAS", role=UserRole.GOVERNMENT,
    )

    # ── Hospitals ──────────────────────────────────────────────────────────────
    if not HOSPITALS_JSON.exists():
        raise FileNotFoundError(f"Hospital seed file not found at {HOSPITALS_JSON}.")

    with open(HOSPITALS_JSON, "r", encoding="utf-8") as f:
        hospital_records = json.load(f)

    print(f"  Seeding {len(hospital_records)} hospitals...")

    first_hospital_id = None
    for record in hospital_records:
        res_data = record.get("resources", {})
        trauma_raw = record.get("trauma_level")
        trauma_level = _TRAUMA_LEVEL_MAP.get(trauma_raw) if trauma_raw else None

        h = Hospital(
            name=record["name"],
            latitude=record["latitude"],
            longitude=record["longitude"],
            address=record.get("address"),
            district=record["district"],
            phone=record.get("phone"),
            trauma_level=trauma_level,
            is_kasb_empaneled=record.get("is_kasb_empaneled", False),
            is_government=record.get("is_government", False),
            is_active=True,
        )
        db.add(h)
        await db.flush()

        resource = HospitalResource(
            hospital_id=h.id,
            icu_beds_total=res_data.get("icu_total", 0),
            icu_beds_available=res_data.get("icu_avail", 0),
            ed_capacity_total=res_data.get("ed_total", 0),
            ed_capacity_current=res_data.get("ed_current", 0),
            ventilators_total=res_data.get("vent_total", 0),
            ventilators_available=res_data.get("vent_avail", 0),
            ot_available=res_data.get("ot", False),
            blood_bank_available=res_data.get("blood_bank", False),
            specialist_on_duty=False,
        )
        db.add(resource)

        if first_hospital_id is None:
            first_hospital_id = h.id

    # ── Hospital Staff Demo Users ──────────────────────────────────────────────
    # Re-fetch the specific hospitals to assign demo staff users to them
    res = await db.execute(
        text("SELECT id, name FROM hospitals WHERE name IN ("
             "'CARITAS HOSPITAL KOTTAYAM', "
             "'JUBILEE MEMORIAL HOSPITAL PALAYAM', "
             "'KOZHIKODE DISTRICT CO-OPERATIVE HOSPITAL', "
             "'JUBILEE MISSION MEDICAL COLLEGE THRISSUR')")
    )
    h_map = {row.name: row.id for row in res}

    demo_hosp_users = [
        {"email": "hospital.kottayam@trauma.demo",  "name": "Dr. Caritas Admin", "hosp_name": "CARITAS HOSPITAL KOTTAYAM"},
        {"email": "hospital.tvm@trauma.demo",       "name": "Dr. Jubilee TVM",   "hosp_name": "JUBILEE MEMORIAL HOSPITAL PALAYAM"},
        {"email": "hospital.kozhikode@trauma.demo", "name": "Dr. Kozhikode Med", "hosp_name": "KOZHIKODE DISTRICT CO-OPERATIVE HOSPITAL"},
        {"email": "hospital.thrissur@trauma.demo",  "name": "Dr. Jubilee TSR",   "hosp_name": "JUBILEE MISSION MEDICAL COLLEGE THRISSUR"}
    ]

    for u in demo_hosp_users:
        hid = h_map.get(u["hosp_name"]) or first_hospital_id
        if hid:
            await create_user(
                db, email=u["email"], password="Hosp@1234", full_name=u["name"],
                role=UserRole.HOSPITAL_STAFF, hospital_id=hid,
            )

    # ── Staging Stations ───────────────────────────────────────────────────────
    stations_data = [
        dict(name="Hindustan Petroleum Thiruvananthapuram", latitude=8.5110, longitude=76.9627,
             district="Thiruvananthapuram", fuel_brand="Hindustan Petroleum", nearby_blackspot_count=6),
        dict(name="Bharat Petrol Thiruvananthapuram",       latitude=8.5076, longitude=76.9621,
             district="Thiruvananthapuram", fuel_brand="Bharat Petroleum",    nearby_blackspot_count=4),
        dict(name="Reliance Petroleum Kozhikode",           latitude=11.2588, longitude=75.7804,
             district="Kozhikode",         fuel_brand="Reliance",             nearby_blackspot_count=2),
        dict(name="Indian Oil Kottayam",                    latitude=9.5800,  longitude=76.5100,
             district="Kottayam",          fuel_brand="Indian Oil",           nearby_blackspot_count=3),
        dict(name="Essar Petrol Malappuram",                latitude=11.1296, longitude=76.0057,
             district="Malappuram",        fuel_brand="Essar",                nearby_blackspot_count=6),
    ]
    station_objs = []
    for sd in stations_data:
        s = StagingStation(**sd)
        db.add(s)
        await db.flush()
        station_objs.append(s)

    # ── Ambulances ────────────────────────────────────────────────────────────
    if not AMBULANCES_JSON.exists():
        print(f"  WARNING: {AMBULANCES_JSON} not found — skipping ambulance seed")
    else:
        with open(AMBULANCES_JSON, "r", encoding="utf-8") as f:
            ambulance_records = json.load(f)

        print(f"  Seeding {len(ambulance_records)} ambulances from JSON...")

        for rec in ambulance_records:
            stg_str = rec.get("staging_station_id", "")
            if stg_str and stg_str.startswith("stg-"):
                try:
                    stg_idx = (int(stg_str.split("-")[1]) - 1) % len(station_objs)
                    stg_id  = station_objs[stg_idx].id
                except (ValueError, IndexError):
                    stg_id = None
            else:
                stg_id = None

            try:
                status = AmbulanceStatus(rec.get("status", "AVAILABLE"))
            except ValueError:
                status = AmbulanceStatus.AVAILABLE

            try:
                amb_type = AmbulanceType(rec.get("ambulance_type", "BLS"))
            except ValueError:
                amb_type = AmbulanceType.BLS

            a = Ambulance(
                registration_no=rec["registration_no"],
                ambulance_type=amb_type,
                district=rec.get("district", "Unknown"),
                current_lat=rec.get("current_lat"),
                current_lon=rec.get("current_lon"),
                status=status,
                staging_station_id=stg_id,
                device_id=rec.get("device_id"),
                speed_kmph=rec.get("speed_kmph"),
                is_active=rec.get("is_active", True),
            )
            db.add(a)

    # ── Black Spots — all 32 from kerala_blackspots.json ──────────────────────
    if not BLACKSPOTS_JSON.exists():
        print(f"  WARNING: {BLACKSPOTS_JSON} not found — skipping blackspot seed")
    else:
        with open(BLACKSPOTS_JSON, "r", encoding="utf-8") as f:
            bs_payload = json.load(f)

        bs_records = (
            bs_payload.get("black_spots", bs_payload)
            if isinstance(bs_payload, dict)
            else bs_payload
        )
        print(f"  Seeding {len(bs_records)} black spots from JSON...")

        for rec in bs_records:
            coords   = rec.get("coordinates", {})
            start_pt = coords.get("starting_point", {})
            end_pt   = coords.get("ending_point", {})

            if start_pt and end_pt:
                mid_lat = round((start_pt["latitude"]  + end_pt["latitude"])  / 2, 6)
                mid_lon = round((start_pt["longitude"] + end_pt["longitude"]) / 2, 6)
            else:
                mid_lat = rec.get("latitude", 10.0)
                mid_lon = rec.get("longitude", 76.0)

            road     = rec.get("road", {})
            priority = rec.get("priority", "").strip()
            severity = _SEVERITY_MAP.get(priority)

            bs = BlackSpot(
                district=rec["district"],
                police_station=rec.get("police_station"),
                location=rec.get("location"),
                priority=priority,
                road_name=road.get("name"),
                road_number=road.get("number"),
                road_type=road.get("type"),
                road_length=road.get("length"),
                latitude=mid_lat,
                longitude=mid_lon,
                start_latitude=start_pt.get("latitude"),
                start_longitude=start_pt.get("longitude"),
                end_latitude=end_pt.get("latitude"),
                end_longitude=end_pt.get("longitude"),
                severity=severity,
                risk_score=_RISK_SCORE_MAP.get(severity, 0.0) if severity else 0.0,
                incident_count=rec.get("incident_count", 0),
                fatality_rate=rec.get("fatality_rate"),
                accidents_per_year=rec.get("accidents_per_year", 0),
                description=(
                    f"{rec.get('location', '')} — "
                    f"{road.get('name', '')} ({road.get('number', '')})"
                ),
            )
            db.add(bs)

    # ── Demo Incidents ─────────────────────────────────────────────────────────
    print("  Seeding demo incidents...")
    demo_incidents = [
        dict(incident_number="INC-2024-001", status=IncidentStatus.CLOSED,
             severity=IncidentSeverity.CRITICAL, accident_type=AccidentType.ROAD_ACCIDENT,
             latitude=8.5241, longitude=76.9366, district="Thiruvananthapuram",
             address_text="NH 66, Kazhakkoottam Bypass, Thiruvananthapuram",
             patient_count=3, golden_hour_met=True,
             description="Multi-vehicle collision on NH 66 bypass"),
        dict(incident_number="INC-2024-002", status=IncidentStatus.CLOSED,
             severity=IncidentSeverity.SEVERE, accident_type=AccidentType.ROAD_ACCIDENT,
             latitude=9.9312, longitude=76.2673, district="Kottayam",
             address_text="MC Road near Kottayam junction",
             patient_count=2, golden_hour_met=True,
             description="Truck-bike collision on MC Road"),
        dict(incident_number="INC-2024-003", status=IncidentStatus.CLOSED,
             severity=IncidentSeverity.MODERATE, accident_type=AccidentType.ROAD_ACCIDENT,
             latitude=11.2588, longitude=75.7804, district="Kozhikode",
             address_text="Beach Road, Calicut",
             patient_count=1, golden_hour_met=True,
             description="Single vehicle skid on Beach Road"),
        dict(incident_number="INC-2024-004", status=IncidentStatus.CLOSED,
             severity=IncidentSeverity.CRITICAL, accident_type=AccidentType.ROAD_ACCIDENT,
             latitude=10.5276, longitude=76.2144, district="Thrissur",
             address_text="NH 544, Thrissur bypass",
             patient_count=4, golden_hour_met=False,
             description="Bus accident with multiple casualties on Thrissur bypass"),
        dict(incident_number="INC-2024-005", status=IncidentStatus.CLOSED,
             severity=IncidentSeverity.SEVERE, accident_type=AccidentType.ROAD_ACCIDENT,
             latitude=11.8745, longitude=75.3704, district="Kannur",
             address_text="Kannur-Thalassery Road",
             patient_count=2, golden_hour_met=True,
             description="Head-on collision near Thalassery junction"),
        dict(incident_number="INC-2024-006", status=IncidentStatus.CLOSED,
             severity=IncidentSeverity.MINOR, accident_type=AccidentType.FALL,
             latitude=9.4981, longitude=76.3388, district="Alappuzha",
             address_text="Alappuzha boat jetty area",
             patient_count=1, golden_hour_met=True,
             description="Fall from boat landing steps"),
        dict(incident_number="INC-2024-007", status=IncidentStatus.HOSPITAL_ARRIVED,
             severity=IncidentSeverity.CRITICAL, accident_type=AccidentType.CARDIAC,
             latitude=10.0159, longitude=76.3419, district="Ernakulam",
             address_text="MG Road, Kochi",
             patient_count=1, golden_hour_met=True,
             description="Cardiac arrest at MG Road junction"),
        dict(incident_number="INC-2024-008", status=IncidentStatus.TRANSPORTING,
             severity=IncidentSeverity.SEVERE, accident_type=AccidentType.ROAD_ACCIDENT,
             latitude=8.8932, longitude=76.6141, district="Kollam",
             address_text="Kollam bypass NH 66",
             patient_count=2, golden_hour_met=None,
             description="Two-wheeler collision on NH 66 Kollam bypass"),
        dict(incident_number="INC-2024-009", status=IncidentStatus.ON_SCENE,
             severity=IncidentSeverity.MODERATE, accident_type=AccidentType.ROAD_ACCIDENT,
             latitude=11.6854, longitude=76.1320, district="Wayanad",
             address_text="Wayanad Ghat Road, Kalpetta",
             patient_count=1, golden_hour_met=None,
             description="Ghat road accident near hairpin bend"),
        dict(incident_number="INC-2024-010", status=IncidentStatus.DISPATCHED,
             severity=IncidentSeverity.SEVERE, accident_type=AccidentType.ROAD_ACCIDENT,
             latitude=10.7867, longitude=76.6548, district="Palakkad",
             address_text="Palakkad-Coimbatore NH 544",
             patient_count=3, golden_hour_met=None,
             description="Lorry rollover on NH 544 near Palakkad"),
        dict(incident_number="INC-2024-011", status=IncidentStatus.REPORTED,
             severity=IncidentSeverity.CRITICAL, accident_type=AccidentType.ROAD_ACCIDENT,
             latitude=9.5916, longitude=76.5222, district="Pathanamthitta",
             address_text="Pathanamthitta-Ranni Road",
             patient_count=2, golden_hour_met=None,
             description="Vehicle fell into roadside canal"),
        dict(incident_number="INC-2024-012", status=IncidentStatus.CLOSED,
             severity=IncidentSeverity.MODERATE, accident_type=AccidentType.BURNS,
             latitude=9.2648, longitude=76.7870, district="Pathanamthitta",
             address_text="Thiruvalla Town",
             patient_count=1, golden_hour_met=True,
             description="Kitchen fire burns victim"),
        dict(incident_number="INC-2024-013", status=IncidentStatus.CLOSED,
             severity=IncidentSeverity.SEVERE, accident_type=AccidentType.ROAD_ACCIDENT,
             latitude=12.4996, longitude=74.9869, district="Kasaragod",
             address_text="Kasaragod NH 66 near Permude",
             patient_count=3, golden_hour_met=False,
             description="Tanker truck collision — delayed response due to terrain"),
        dict(incident_number="INC-2024-014", status=IncidentStatus.CLOSED,
             severity=IncidentSeverity.MINOR, accident_type=AccidentType.ROAD_ACCIDENT,
             latitude=11.1271, longitude=76.0671, district="Malappuram",
             address_text="Malappuram bypass road",
             patient_count=1, golden_hour_met=True,
             description="Minor skid injury on bypass"),
        dict(incident_number="INC-2024-015", status=IncidentStatus.CLOSED,
             severity=IncidentSeverity.CRITICAL, accident_type=AccidentType.ROAD_ACCIDENT,
             latitude=8.7642, longitude=76.7274, district="Thiruvananthapuram",
             address_text="Attingal-Chirayinkeezhu stretch, NH 66",
             patient_count=5, is_mci=True, golden_hour_met=False,
             description="MCI — bus rollover with 5 critical patients"),
    ]

    for inc_data in demo_incidents:
        inc = Incident(reported_by_id=admin.id, **inc_data)
        db.add(inc)

    await db.flush()
    print("Seed data inserted successfully.")