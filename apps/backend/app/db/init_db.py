from sqlalchemy.ext.asyncio import AsyncSession
from app.services.auth_service import create_user, get_user_by_email
from app.services.hospital_service import update_resources
from app.core.constants import UserRole, TraumaLevel, AmbulanceType, AmbulanceStatus, BlackSpotSeverity
from app.models.hospital import Hospital, HospitalResource
from app.models.ambulance import Ambulance, StagingStation
from app.models.blackspot import BlackSpot
import uuid


async def init_db(db: AsyncSession):
    """Seed initial data if DB is empty."""

    # Create default admin
    existing = await get_user_by_email(db, "admin@trauma.kerala.gov.in")
    if existing:
        return

    print("Seeding initial data...")

    admin = await create_user(db, email="admin@trauma.kerala.gov.in",
        password="Admin@1234", full_name="System Administrator", role=UserRole.ADMIN)

    dispatcher = await create_user(db, email="dispatcher@trauma.kerala.gov.in",
        password="Dispatch@1234", full_name="Arun Krishnan", role=UserRole.DISPATCHER)

    gov = await create_user(db, email="gov@trauma.kerala.gov.in",
        password="Gov@1234", full_name="Anitha Nair", role=UserRole.GOVERNMENT)

    # Hospitals
    hospitals_data = [
        dict(name="Government Medical College Thiruvananthapuram", latitude=8.5241, longitude=76.9366,
             district="Thiruvananthapuram", trauma_level=TraumaLevel.LEVEL_1, is_kasb_empaneled=True, is_government=True,
             phone="0471-2528386", address="Medical College, Thiruvananthapuram 695011",
             icu_total=50, icu_avail=12, ed_total=100, ed_curr=60, vent_total=25, vent_avail=8),
        dict(name="Government Medical College Kozhikode", latitude=11.2500, longitude=75.7800,
             district="Kozhikode", trauma_level=TraumaLevel.LEVEL_1, is_kasb_empaneled=True, is_government=True,
             phone="0495-2350216", address="Medical College Road, Kozhikode 673008",
             icu_total=60, icu_avail=4, ed_total=100, ed_curr=85, vent_total=30, vent_avail=2),
        dict(name="Government Medical College Kottayam", latitude=9.5916, longitude=76.5222,
             district="Kottayam", trauma_level=TraumaLevel.LEVEL_1, is_kasb_empaneled=True, is_government=True,
             phone="0481-2597001", address="Gandhinagar, Kottayam 686008",
             icu_total=40, icu_avail=10, ed_total=80, ed_curr=55, vent_total=20, vent_avail=6),
        dict(name="Government Medical College Kollam", latitude=8.8932, longitude=76.6141,
             district="Kollam", trauma_level=TraumaLevel.LEVEL_2, is_kasb_empaneled=True, is_government=True,
             phone="0474-2794387", address="Parippally, Kollam 691574",
             icu_total=24, icu_avail=8, ed_total=50, ed_curr=30, vent_total=12, vent_avail=5),
        dict(name="Jubilee Mission Medical College Thrissur", latitude=10.5276, longitude=76.2144,
             district="Thrissur", trauma_level=TraumaLevel.LEVEL_2, is_kasb_empaneled=True, is_government=False,
             phone="0487-2435501", address="Perinchery, Thrissur 680005",
             icu_total=24, icu_avail=12, ed_total=50, ed_curr=28, vent_total=12, vent_avail=7),
        dict(name="KIMS Hospital Thiruvananthapuram", latitude=8.5000, longitude=76.9500,
             district="Thiruvananthapuram", trauma_level=TraumaLevel.LEVEL_1, is_kasb_empaneled=True, is_government=False,
             phone="0471-3041000", address="Anayara, Thiruvananthapuram 695024",
             icu_total=40, icu_avail=15, ed_total=80, ed_curr=42, vent_total=20, vent_avail=10),
    ]

    hospital_objs = []
    for hd in hospitals_data:
        h = Hospital(
            name=hd["name"], latitude=hd["latitude"], longitude=hd["longitude"],
            district=hd["district"], trauma_level=hd["trauma_level"],
            is_kasb_empaneled=hd["is_kasb_empaneled"], is_government=hd["is_government"],
            phone=hd["phone"], address=hd["address"],
        )
        db.add(h)
        await db.flush()
        res = HospitalResource(
            hospital_id=h.id,
            icu_beds_total=hd["icu_total"], icu_beds_available=hd["icu_avail"],
            ed_capacity_total=hd["ed_total"], ed_capacity_current=hd["ed_curr"],
            ventilators_total=hd["vent_total"], ventilators_available=hd["vent_avail"],
            ot_available=True, blood_bank_available=True, specialist_on_duty=True,
        )
        db.add(res)
        hospital_objs.append(h)

    # Hospital staff users
    await create_user(db, email="hospital@trauma.kerala.gov.in",
        password="Hosp@1234", full_name="Dr. Suresh Pillai",
        role=UserRole.HOSPITAL_STAFF, hospital_id=hospital_objs[0].id)

    # Staging stations (petrol pumps)
    stations_data = [
        dict(name="Hindustan Petroleum Thiruvananthapuram", latitude=8.5110, longitude=76.9627,
             district="Thiruvananthapuram", fuel_brand="Hindustan Petroleum", nearby_blackspot_count=6),
        dict(name="Bharat Petrol Thiruvananthapuram", latitude=8.5076, longitude=76.9621,
             district="Thiruvananthapuram", fuel_brand="Bharat Petroleum", nearby_blackspot_count=4),
        dict(name="Reliance Petroleum Kozhikode", latitude=11.2588, longitude=75.7804,
             district="Kozhikode", fuel_brand="Reliance", nearby_blackspot_count=2),
        dict(name="Indian Oil Kottayam", latitude=9.5800, longitude=76.5100,
             district="Kottayam", fuel_brand="Indian Oil", nearby_blackspot_count=3),
        dict(name="Essar Petrol Malappuram", latitude=11.1296, longitude=76.0057,
             district="Malappuram", fuel_brand="Essar", nearby_blackspot_count=6),
    ]
    station_objs = []
    for sd in stations_data:
        s = StagingStation(**sd)
        db.add(s)
        await db.flush()
        station_objs.append(s)

    # Ambulances
    ambulances_data = [
        dict(reg="KL-08-001", typ=AmbulanceType.ALS, district="Thiruvananthapuram", lat=8.5110, lon=76.9627, st=0),
        dict(reg="KL-08-002", typ=AmbulanceType.ALS, district="Thiruvananthapuram", lat=8.5076, lon=76.9621, st=1),
        dict(reg="KL-08-003", typ=AmbulanceType.BLS, district="Kollam", lat=8.8800, lon=76.6000, st=None),
        dict(reg="KL-08-004", typ=AmbulanceType.BLS, district="Kottayam", lat=9.5800, lon=76.5100, st=3),
        dict(reg="KL-08-005", typ=AmbulanceType.ALS, district="Kozhikode", lat=11.2588, lon=75.7804, st=2),
        dict(reg="KL-08-006", typ=AmbulanceType.BLS, district="Malappuram", lat=11.1296, lon=76.0057, st=4),
        dict(reg="KL-08-007", typ=AmbulanceType.NICU, district="Thrissur", lat=10.5276, lon=76.2144, st=None),
        dict(reg="KL-08-008", typ=AmbulanceType.ALS, district="Thiruvananthapuram", lat=8.4800, lon=76.9200, st=None),
    ]
    for i, ad in enumerate(ambulances_data):
        a = Ambulance(
            registration_no=ad["reg"],
            ambulance_type=ad["typ"],
            district=ad["district"],
            current_lat=ad["lat"],
            current_lon=ad["lon"],
            status=AmbulanceStatus.AVAILABLE,
            staging_station_id=station_objs[ad["st"]].id if ad["st"] is not None else None,
            device_id=f"GPS-{ad['reg']}",
            is_active=True,
        )
        db.add(a)

    # Black spots
    blackspots_data = [
        dict(name="District Road THI-25", lat=8.5268, lon=76.7999, district="Thiruvananthapuram",
             road="District Road THI-25", count=30, fat=29.0, apy=30, sev=BlackSpotSeverity.HIGH),
        dict(name="City Road THI-73", lat=8.5339, lon=76.9124, district="Thiruvananthapuram",
             road="City Road THI-73", count=45, fat=9.0, apy=45, sev=BlackSpotSeverity.MEDIUM),
        dict(name="MC Road Kottayam", lat=9.9312, lon=76.2673, district="Kottayam",
             road="MC Road (NH 183)", count=47, fat=15.0, apy=47, sev=BlackSpotSeverity.HIGH),
        dict(name="Calicut Beach Road", lat=11.2588, lon=75.7804, district="Kozhikode",
             road="Beach Road", count=28, fat=10.0, apy=28, sev=BlackSpotSeverity.MEDIUM),
        dict(name="Thrissur-Palakkad Highway", lat=10.5276, lon=76.2144, district="Thrissur",
             road="NH 544", count=32, fat=12.0, apy=32, sev=BlackSpotSeverity.HIGH),
        dict(name="Kasaragod NH", lat=12.4996, lon=74.9981, district="Kasaragod",
             road="NH 66", count=25, fat=18.0, apy=25, sev=BlackSpotSeverity.HIGH),
        dict(name="Wayanad Vythiri", lat=11.5145, lon=76.0530, district="Wayanad",
             road="Calicut-Mysore Highway", count=20, fat=22.0, apy=20, sev=BlackSpotSeverity.HIGH),
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
