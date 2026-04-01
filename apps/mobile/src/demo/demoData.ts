export const DEMO_MODE = true

export const DEMO_USER = {
  id: "u-paramedic-001",
  email: "paramedic@trauma.demo",
  full_name: "Rajan Pillai",
  role: "PARAMEDIC",
  ambulance_id: "amb-001",
}

export const DEMO_HOSPITALS = [
  { id: "h-001", name: "Medical College Hospital Kottayam", district: "Kottayam", trauma_level: "LEVEL_1", latitude: 9.5916, longitude: 76.5222, icu_available: 6, eta_minutes: 12 },
  { id: "h-002", name: "SAT Hospital Thiruvananthapuram", district: "Thiruvananthapuram", trauma_level: "LEVEL_1", latitude: 8.5241, longitude: 76.9366, icu_available: 18, eta_minutes: 8 },
  { id: "h-003", name: "GMC Kozhikode", district: "Kozhikode", trauma_level: "LEVEL_1", latitude: 11.2500, longitude: 75.7800, icu_available: 2, eta_minutes: 22 },
]

export const DEMO_ACTIVE_INCIDENT = {
  id: "inc-demo-001",
  incident_number: "TRK-20240324-DEMO",
  status: "ON_SCENE",
  severity: "SEVERE",
  accident_type: "ROAD_ACCIDENT",
  latitude: 9.9312,
  longitude: 76.2673,
  address_text: "MC Road, Kottayam",
  district: "Kottayam",
  patient_count: 2,
  created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  dispatched_ambulance_id: "amb-001",
  receiving_hospital_id: "h-001",
}

export const KERALA_GPS_ROUTE = [
  { latitude: 9.9312, longitude: 76.2673 },
  { latitude: 9.9412, longitude: 76.2773 },
  { latitude: 9.9512, longitude: 76.2873 },
  { latitude: 9.9612, longitude: 76.2973 },
  { latitude: 9.9712, longitude: 76.3073 },
]
