export const DEMO_USERS: Record<string, { password: string; user: any; tokens: any }> = {
  "dispatcher@trauma.demo": {
    password: "Demo@1234",
    user: { id: "u-001", email: "dispatcher@trauma.demo", full_name: "Arun Krishnan", role: "DISPATCHER", phone: "+91-9876543210", hospital_id: null, ambulance_id: null, is_active: true },
    tokens: { access_token: "demo_token_dispatcher", token_type: "bearer" },
  },
  "admin@trauma.demo": {
    password: "Admin@1234",
    user: { id: "u-002", email: "admin@trauma.demo", full_name: "Priya Menon", role: "ADMIN", phone: "+91-9876543211", hospital_id: null, ambulance_id: null, is_active: true },
    tokens: { access_token: "demo_token_admin", token_type: "bearer" },
  },
  // Hospital Staff accounts — one per demo hospital
  "hospital.kottayam@trauma.demo": {
    password: "Hosp@1234",
    user: { id: "u-003", email: "hospital.kottayam@trauma.demo", full_name: "Dr. Sreeja Nair", role: "HOSPITAL_STAFF", phone: "+91-9876543212", hospital_id: "h-001", ambulance_id: null, is_active: true },
    tokens: { access_token: "demo_token_hospital_kottayam", token_type: "bearer" },
  },
  // Legacy alias — still works for existing demos
  "hospital@trauma.demo": {
    password: "Hosp@1234",
    user: { id: "u-003", email: "hospital.kottayam@trauma.demo", full_name: "Dr. Sreeja Nair", role: "HOSPITAL_STAFF", phone: "+91-9876543212", hospital_id: "h-001", ambulance_id: null, is_active: true },
    tokens: { access_token: "demo_token_hospital_kottayam", token_type: "bearer" },
  },
  "hospital.tvm@trauma.demo": {
    password: "Hosp@1234",
    user: { id: "u-005", email: "hospital.tvm@trauma.demo", full_name: "Dr. Anitha Pillai", role: "HOSPITAL_STAFF", phone: "+91-9876543214", hospital_id: "h-002", ambulance_id: null, is_active: true },
    tokens: { access_token: "demo_token_hospital_tvm", token_type: "bearer" },
  },
  "hospital.kozhikode@trauma.demo": {
    password: "Hosp@1234",
    user: { id: "u-006", email: "hospital.kozhikode@trauma.demo", full_name: "Dr. Rajan Kutty", role: "HOSPITAL_STAFF", phone: "+91-9876543215", hospital_id: "h-003", ambulance_id: null, is_active: true },
    tokens: { access_token: "demo_token_hospital_kozhikode", token_type: "bearer" },
  },
  "hospital.thrissur@trauma.demo": {
    password: "Hosp@1234",
    user: { id: "u-007", email: "hospital.thrissur@trauma.demo", full_name: "Dr. Mary Thomas", role: "HOSPITAL_STAFF", phone: "+91-9876543216", hospital_id: "h-004", ambulance_id: null, is_active: true },
    tokens: { access_token: "demo_token_hospital_thrissur", token_type: "bearer" },
  },
  "gov@trauma.demo": {
    password: "Gov@1234",
    user: { id: "u-004", email: "gov@trauma.demo", full_name: "Suresh Kumar IAS", role: "GOVERNMENT", phone: "+91-9876543213", hospital_id: null, ambulance_id: null, is_active: true },
    tokens: { access_token: "demo_token_gov", token_type: "bearer" },
  },
}

export const DEMO_INCIDENTS = [
  { id: "inc-001", incident_number: "TRK-20240312-001", accident_type: "ROAD_ACCIDENT", severity: "CRITICAL", status: "EN_ROUTE", district: "Kottayam", latitude: 9.5916, longitude: 76.5222, patient_count: 2, created_at: new Date(Date.now() - 52 * 60000).toISOString() },
  { id: "inc-002", incident_number: "TRK-20240312-002", accident_type: "FALL", severity: "SEVERE", status: "ON_SCENE", district: "Thrissur", latitude: 10.5276, longitude: 76.2144, patient_count: 1, created_at: new Date(Date.now() - 35 * 60000).toISOString() },
  { id: "inc-003", incident_number: "TRK-20240312-003", accident_type: "CARDIAC", severity: "MODERATE", status: "REPORTED", district: "Thiruvananthapuram", latitude: 8.5241, longitude: 76.9366, patient_count: 1, created_at: new Date(Date.now() - 8 * 60000).toISOString() },
  { id: "inc-004", incident_number: "TRK-20240312-004", accident_type: "ROAD_ACCIDENT", severity: "SEVERE", status: "HOSPITAL_ARRIVED", district: "Kozhikode", latitude: 11.2500, longitude: 75.7800, patient_count: 3, created_at: new Date(Date.now() - 130 * 60000).toISOString() },
  { id: "inc-005", incident_number: "TRK-20240312-005", accident_type: "BURNS", severity: "CRITICAL", status: "DISPATCH_PENDING", district: "Kottayam", latitude: 9.6000, longitude: 76.5100, patient_count: 1, created_at: new Date(Date.now() - 18 * 60000).toISOString() },
]

export const DEMO_AMBULANCES = [
  { id: "amb-001", registration_no: "KL-05-AA-1234", ambulance_type: "ALS", status: "EN_ROUTE", district: "Kottayam", current_lat: 9.5916, current_lon: 76.5222, device_id: "DEV-001" },
  { id: "amb-002", registration_no: "KL-07-BB-5678", ambulance_type: "BLS", status: "AVAILABLE", district: "Kozhikode", current_lat: 11.2500, current_lon: 75.7800, device_id: "DEV-002" },
  { id: "amb-003", registration_no: "KL-08-CC-9012", ambulance_type: "ALS", status: "AVAILABLE", district: "Thrissur", current_lat: 10.5276, current_lon: 76.2144, device_id: "DEV-003" },
  { id: "amb-004", registration_no: "KL-01-DD-3456", ambulance_type: "NICU", status: "ON_SCENE", district: "Thiruvananthapuram", current_lat: 8.5241, current_lon: 76.9366, device_id: "DEV-004" },
  { id: "amb-005", registration_no: "KL-09-EE-7890", ambulance_type: "BLS", status: "AVAILABLE", district: "Ernakulam", current_lat: 9.9312, current_lon: 76.2673, device_id: "DEV-005" },
]

export const DEMO_HOSPITALS = [
  { id: "h-001", name: "Medical College Hospital Kottayam", district: "Kottayam", trauma_level: "LEVEL_1", latitude: 9.5916, longitude: 76.5222, is_government: true, is_kasb_empaneled: true, resources: { icu_beds_total: 40, icu_beds_available: 6, ventilators_total: 20, ventilators_available: 4, ot_available: true, ed_capacity_total: 80, ed_capacity_current: 54, blood_bank_available: true } },
  { id: "h-002", name: "SAT Hospital Thiruvananthapuram", district: "Thiruvananthapuram", trauma_level: "LEVEL_1", latitude: 8.5241, longitude: 76.9366, is_government: true, is_kasb_empaneled: true, resources: { icu_beds_total: 50, icu_beds_available: 18, ventilators_total: 25, ventilators_available: 10, ot_available: true, ed_capacity_total: 100, ed_capacity_current: 48, blood_bank_available: true } },
  { id: "h-003", name: "Government Medical College Kozhikode", district: "Kozhikode", trauma_level: "LEVEL_1", latitude: 11.2500, longitude: 75.7800, is_government: true, is_kasb_empaneled: true, resources: { icu_beds_total: 60, icu_beds_available: 2, ventilators_total: 30, ventilators_available: 1, ot_available: true, ed_capacity_total: 120, ed_capacity_current: 110, blood_bank_available: true } },
  { id: "h-004", name: "Jubilee Mission Medical College Thrissur", district: "Thrissur", trauma_level: "LEVEL_2", latitude: 10.5276, longitude: 76.2144, is_government: false, is_kasb_empaneled: false, resources: { icu_beds_total: 24, icu_beds_available: 12, ventilators_total: 10, ventilators_available: 5, ot_available: true, ed_capacity_total: 60, ed_capacity_current: 37, blood_bank_available: true } },
]

export const DEMO_BLACKSPOTS = [
  { id: "bs-001", road_name: "MC Road (NH 183)", name: "MC Road (NH 183)", district: "Kottayam", latitude: 9.9312, longitude: 76.2673, accidents_per_year: 45, fatality_rate: 28, risk_score: 8.9, severity: "HIGH" },
  { id: "bs-002", road_name: "NH 544 Ernakulam Stretch", name: "NH 544", district: "Ernakulam", latitude: 10.0551, longitude: 76.3109, accidents_per_year: 38, fatality_rate: 22, risk_score: 7.2, severity: "MEDIUM" },
  { id: "bs-003", road_name: "Beach Road Kozhikode", name: "Beach Road", district: "Kozhikode", latitude: 11.2588, longitude: 75.7804, accidents_per_year: 29, fatality_rate: 18, risk_score: 6.5, severity: "MEDIUM" },
  { id: "bs-004", road_name: "Kasaragod NH Corridor", name: "Kasaragod NH", district: "Kasaragod", latitude: 12.4996, longitude: 74.9981, accidents_per_year: 52, fatality_rate: 35, risk_score: 9.4, severity: "HIGH" },
  { id: "bs-005", road_name: "Wayanad Hill Stretch", name: "Wayanad Vythiri", district: "Wayanad", latitude: 11.5145, longitude: 76.0530, accidents_per_year: 41, fatality_rate: 31, risk_score: 8.7, severity: "HIGH" },
  { id: "bs-006", road_name: "Idukki Munnar Road", name: "Idukki Hill", district: "Idukki", latitude: 9.8500, longitude: 76.9700, accidents_per_year: 33, fatality_rate: 26, risk_score: 7.8, severity: "MEDIUM" },
  { id: "bs-007", road_name: "Palakkad NH 544", name: "Palakkad Junction", district: "Palakkad", latitude: 10.7867, longitude: 76.6548, accidents_per_year: 27, fatality_rate: 15, risk_score: 5.9, severity: "LOW" },
]

export const DEMO_KPI = {
  active_incidents: 3,
  ambulances_available: 2,
  ambulances_total: 5,
  golden_hour_compliance_pct: 73.4,
  avg_response_time_sec: 487,
  total_incidents_today: 5,
  hospital_count: 4,
  blackspot_count: 7,
}

export const DEMO_NOTIFICATIONS = [
  { id: "n-001", message: "ICU capacity critical: GMC Kozhikode at 97% — only 2 beds available", severity: "HIGH", is_read: false, created_at: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: "n-002", message: "Response SLA breach: TRK-20240312-005 — no ambulance dispatched in 5 min", severity: "HIGH", is_read: false, created_at: new Date(Date.now() - 8 * 60000).toISOString() },
  { id: "n-003", message: "New incident: TRK-20240312-003 — Cardiac, Thiruvananthapuram", severity: "MEDIUM", is_read: true, created_at: new Date(Date.now() - 12 * 60000).toISOString() },
  { id: "n-004", message: "Ambulance KL-01-DD-3456 arrived on scene — Thiruvananthapuram", severity: "LOW", is_read: true, created_at: new Date(Date.now() - 20 * 60000).toISOString() },
]
