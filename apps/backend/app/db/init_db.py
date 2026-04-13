import json
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.auth_service import create_user, get_user_by_email
from app.core.constants import UserRole, TraumaLevel, AmbulanceType, AmbulanceStatus, BlackSpotSeverity
from app.models.hospital import Hospital, HospitalResource
from app.models.ambulance import Ambulance, StagingStation
from app.models.blackspot import BlackSpot

# Path: apps/backend/app/db/init_db.py  →  JSON files sit at apps/backend/
HOSPITALS_JSON    = Path(__file__).resolve().parent.parent.parent / "kerala_hospitals_geocoded.json"
AMBULANCES_JSON   = Path(__file__).resolve().parent.parent.parent / "kerala_ambulances_50.json"

_TRAUMA_LEVEL_MAP = {
    "LEVEL_1": TraumaLevel.LEVEL_1,
    "LEVEL_2": TraumaLevel.LEVEL_2,
    "LEVEL_3": TraumaLevel.LEVEL_3,
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

    # ── Demo accounts (shown on the login page quick-login buttons) ────────────
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

    # ── Hospitals from JSON ────────────────────────────────────────────────────
    if not HOSPITALS_JSON.exists():
        raise FileNotFoundError(
            f"Hospital seed file not found at {HOSPITALS_JSON}. "
            "Place kerala_hospitals_geocoded.json in apps/backend/"
        )

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

    # Hospital staff users tied to first hospital
    if first_hospital_id:
        await create_user(
            db, email="hospital@trauma.kerala.gov.in",
            password="Hosp@1234", full_name="Dr. Suresh Pillai",
            role=UserRole.HOSPITAL_STAFF, hospital_id=first_hospital_id,
        )
        # Demo account shown on login page
        await create_user(
            db, email="hospital@trauma.demo",
            password="Hosp@1234", full_name="Dr. Sreeja Nair",
            role=UserRole.HOSPITAL_STAFF, hospital_id=first_hospital_id,
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

    # ── Ambulances from JSON ──────────────────────────────────────────────────
    if not AMBULANCES_JSON.exists():
        print(f"  WARNING: {AMBULANCES_JSON} not found — skipping ambulance seed")
    else:
        with open(AMBULANCES_JSON, "r", encoding="utf-8") as f:
            ambulance_records = json.load(f)

        print(f"  Seeding {len(ambulance_records)} ambulances from JSON...")

        for rec in ambulance_records:
            # Map staging_station_id string (e.g. "stg-003") to one of the 5 real station objects
            stg_str = rec.get("staging_station_id", "")
            if stg_str and stg_str.startswith("stg-"):
                try:
                    stg_idx = (int(stg_str.split("-")[1]) - 1) % len(station_objs)
                    stg_id  = station_objs[stg_idx].id
                except (ValueError, IndexError):
                    stg_id = None
            else:
                stg_id = None

            # Parse status — fall back to AVAILABLE if unrecognised
            try:
                status = AmbulanceStatus(rec.get("status", "AVAILABLE"))
            except ValueError:
                status = AmbulanceStatus.AVAILABLE

            # Parse type — fall back to BLS if unrecognised
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

    # ── Black Spots ────────────────────────────────────────────────────────────
    blackspots_data = [
        dict(name="District Road THI-25",      lat=8.5268,  lon=76.7999, district="Thiruvananthapuram",
             road="District Road THI-25",       count=30, fat=29.0, apy=30, sev=BlackSpotSeverity.HIGH),
        dict(name="City Road THI-73",           lat=8.5339,  lon=76.9124, district="Thiruvananthapuram",
             road="City Road THI-73",           count=45, fat=9.0,  apy=45, sev=BlackSpotSeverity.MEDIUM),
        dict(name="MC Road Kottayam",           lat=9.9312,  lon=76.2673, district="Kottayam",
             road="MC Road (NH 183)",           count=47, fat=15.0, apy=47, sev=BlackSpotSeverity.HIGH),
        dict(name="Calicut Beach Road",         lat=11.2588, lon=75.7804, district="Kozhikode",
             road="Beach Road",                 count=28, fat=10.0, apy=28, sev=BlackSpotSeverity.MEDIUM),
        dict(name="Thrissur-Palakkad Highway",  lat=10.5276, lon=76.2144, district="Thrissur",
             road="NH 544",                     count=32, fat=12.0, apy=32, sev=BlackSpotSeverity.HIGH),
        dict(name="Kasaragod NH",               lat=12.4996, lon=74.9981, district="Kasaragod",
             road="NH 66",                      count=25, fat=18.0, apy=25, sev=BlackSpotSeverity.HIGH),
        dict(name="Wayanad Vythiri",            lat=11.5145, lon=76.0530, district="Wayanad",
             road="Calicut-Mysore Highway",     count=20, fat=22.0, apy=20, sev=BlackSpotSeverity.HIGH),
    ]
    for bd in blackspots_data:
        risk = min(10.0, (bd["count"] / 10) + bd["fat"] * 0.1)
        bs = BlackSpot(
            name=bd["name"], latitude=bd["lat"], longitude=bd["lon"],
            district=bd["district"], road_name=bd["road"],
            incident_count=bd["count"], fatality_rate=bd["fat"],
            accidents_per_year=bd["apy"], severity=bd["sev"], risk_score=risk,
        )
        db.add(bs)

    await db.flush()
    print("Seed data inserted successfully.")