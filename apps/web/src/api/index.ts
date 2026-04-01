import apiClient from "./client"
import { DEMO_INCIDENTS, DEMO_AMBULANCES, DEMO_HOSPITALS, DEMO_BLACKSPOTS, DEMO_KPI, DEMO_NOTIFICATIONS } from "./demo-fixtures"

const DEMO = import.meta.env.VITE_DEMO_MODE === "true"

export const incidentsApi = {
  getActive: async () => {
    if (DEMO) return { data: DEMO_INCIDENTS.filter(i => !["CLOSED","CANCELLED"].includes(i.status)) }
    return apiClient.get("/incidents/active")
  },
  getAll: async (params?: any) => {
    if (DEMO) return { data: DEMO_INCIDENTS }
    return apiClient.get("/incidents", { params })
  },
  getOne: async (id: string) => {
    if (DEMO) return { data: DEMO_INCIDENTS.find(i => i.id === id) }
    return apiClient.get(`/incidents/${id}`)
  },
  create: async (data: any) => {
    if (DEMO) return { data: { ...data, id: crypto.randomUUID(), incident_number: `TRK-${Date.now()}`, status: "REPORTED", created_at: new Date().toISOString() } }
    return apiClient.post("/incidents", data)
  },
  updateStatus: async (id: string, status: string, note?: string) => {
    if (DEMO) return { data: { id, status } }
    return apiClient.patch(`/incidents/${id}/status`, { status, note })
  },
}

export const ambulancesApi = {
  getAll: async (params?: any) => {
    if (DEMO) return { data: DEMO_AMBULANCES }
    return apiClient.get("/ambulances", { params })
  },
  getOne: async (id: string) => {
    if (DEMO) return { data: DEMO_AMBULANCES.find(a => a.id === id) }
    return apiClient.get(`/ambulances/${id}`)
  },
  pushLocation: async (id: string, lat: number, lon: number, speed?: number) => {
    if (DEMO) return { data: { status: "updated" } }
    return apiClient.post(`/ambulances/${id}/location`, { latitude: lat, longitude: lon, speed_kmph: speed })
  },
  updateStatus: async (id: string, status: string) => {
    if (DEMO) return { data: { id, status } }
    return apiClient.patch(`/ambulances/${id}/status`, { status })
  },
  getStations: async () => {
    if (DEMO) return { data: [] }
    return apiClient.get("/ambulances/stations")
  },
  create: async (data: any) => {
    if (DEMO) return { data }
    return apiClient.post("/ambulances", data)
  },
}

export const hospitalsApi = {
  getAll: async (params?: any) => {
    if (DEMO) return { data: DEMO_HOSPITALS }
    return apiClient.get("/hospitals", { params })
  },
  getOne: async (id: string) => {
    if (DEMO) return { data: DEMO_HOSPITALS.find(h => h.id === id) }
    return apiClient.get(`/hospitals/${id}`)
  },
  updateResources: async (id: string, data: any) => {
    if (DEMO) return { data: { status: "updated" } }
    return apiClient.put(`/hospitals/${id}/resources`, data)
  },
  recommend: async (lat: number, lon: number, triage_color?: string) => {
    if (DEMO) return { data: DEMO_HOSPITALS[0] }
    return apiClient.get("/hospitals/recommend", { params: { lat, lon, triage_color } })
  },
  create: async (data: any) => {
    if (DEMO) return { data }
    return apiClient.post("/hospitals", data)
  },
}

export const dispatchApi = {
  recommend: async (incident_id: string) => {
    if (DEMO) {
      const amb = DEMO_AMBULANCES.filter(a => a.status === "AVAILABLE").map(a => ({
        ambulance_id: a.id, registration_no: a.registration_no,
        ambulance_type: a.ambulance_type, district: a.district,
        distance_km: Math.random() * 10 + 1, eta_minutes: Math.random() * 15 + 5,
      }))
      return { data: { ambulances: amb.slice(0,3), hospitals: DEMO_HOSPITALS.slice(0,3).map(h => ({ hospital_id: h.id, name: h.name, district: h.district, trauma_level: h.trauma_level, distance_km: Math.random()*20+5, eta_minutes: Math.random()*30+10, icu_beds_available: h.resources?.icu_beds_available || 0 })) } }
    }
    return apiClient.get("/dispatch/recommend", { params: { incident_id } })
  },
  confirm: async (data: any) => {
    if (DEMO) return { data: { status: "dispatched" } }
    return apiClient.post("/dispatch/confirm", data)
  },
}

export const patientsApi = {
  getForIncident: async (incident_id: string) => {
    if (DEMO) return { data: [] }
    return apiClient.get(`/incidents/${incident_id}/patients`)
  },
  addPatient: async (incident_id: string, data: any) => {
    if (DEMO) return { data: [{ ...data, id: crypto.randomUUID(), incident_id }] }
    return apiClient.post(`/incidents/${incident_id}/patients`, data)
  },
  recordVitals: async (patient_id: string, data: any) => {
    if (DEMO) return { data: { status: "recorded" } }
    return apiClient.post(`/patients/${patient_id}/vitals`, data)
  },
  recordTriage: async (patient_id: string, data: any) => {
    if (DEMO) return { data: { triage_color: "RED", protocol: "START" } }
    return apiClient.post(`/patients/${patient_id}/triage`, data)
  },
}

export const blackspotsApi = {
  getAll: async (params?: any) => {
    if (DEMO) return { data: DEMO_BLACKSPOTS }
    return apiClient.get("/blackspots", { params })
  },
  getHeatmap: async (district?: string) => {
    if (DEMO) return { data: DEMO_BLACKSPOTS.map(b => ({ lat: b.latitude, lon: b.longitude, weight: b.risk_score, district: b.district })) }
    return apiClient.get("/blackspots/heatmap", { params: { district } })
  },
  create: async (data: any) => {
    if (DEMO) return { data }
    return apiClient.post("/blackspots", data)
  },
}

export const analyticsApi = {
  getKPI: async (district?: string) => {
    if (DEMO) return { data: DEMO_KPI }
    return apiClient.get("/analytics/kpi", { params: { district } })
  },
  getDistrictPerformance: async () => {
    if (DEMO) return { data: [
      { district: "Thiruvananthapuram", total_incidents: 245, golden_hour_met: 198, compliance_pct: 80.8 },
      { district: "Kozhikode", total_incidents: 312, golden_hour_met: 218, compliance_pct: 69.9 },
      { district: "Kottayam", total_incidents: 189, golden_hour_met: 142, compliance_pct: 75.1 },
      { district: "Thrissur", total_incidents: 201, golden_hour_met: 155, compliance_pct: 77.1 },
      { district: "Ernakulam", total_incidents: 278, golden_hour_met: 224, compliance_pct: 80.6 },
      { district: "Kollam", total_incidents: 167, golden_hour_met: 118, compliance_pct: 70.7 },
      { district: "Kasaragod", total_incidents: 98, golden_hour_met: 52, compliance_pct: 53.1 },
      { district: "Wayanad", total_incidents: 76, golden_hour_met: 38, compliance_pct: 50.0 },
      { district: "Kannur", total_incidents: 134, golden_hour_met: 88, compliance_pct: 65.7 },
      { district: "Palakkad", total_incidents: 156, golden_hour_met: 112, compliance_pct: 71.8 },
      { district: "Malappuram", total_incidents: 143, golden_hour_met: 98, compliance_pct: 68.5 },
      { district: "Idukki", total_incidents: 89, golden_hour_met: 51, compliance_pct: 57.3 },
      { district: "Pathanamthitta", total_incidents: 112, golden_hour_met: 82, compliance_pct: 73.2 },
      { district: "Alappuzha", total_incidents: 178, golden_hour_met: 138, compliance_pct: 77.5 },
    ] }
    return apiClient.get("/analytics/district-performance")
  },
}

export const simulationApi = {
  run: async (data: any) => {
    if (DEMO) return { data: {
      total_blackspots: 515, covered: 423, coverage_pct: 82.1,
      gaps: [
        { blackspot_id: "bs-006", name: "Kasaragod NH", district: "Kasaragod", latitude: 12.4996, longitude: 74.9981, min_eta_minutes: 68.4 },
        { blackspot_id: "bs-007", name: "Wayanad Vythiri", district: "Wayanad", latitude: 11.5145, longitude: 76.0530, min_eta_minutes: 72.1 },
        { blackspot_id: "bs-008", name: "Idukki Hill Stretch", district: "Idukki", latitude: 9.8500, longitude: 76.9700, min_eta_minutes: 81.3 },
      ],
      recommendation: "Add 3 ambulance bases to cover 92 underserved black spots in Kasaragod, Wayanad, and Idukki districts"
    } }
    return apiClient.post("/simulation/run", data)
  },
}

export const notificationsApi = {
  getAll: async () => {
    if (DEMO) return { data: DEMO_NOTIFICATIONS }
    return apiClient.get("/notifications")
  },
  markRead: async (id: string) => {
    if (DEMO) return { data: { status: "ok" } }
    return apiClient.post(`/notifications/${id}/read`)
  },
}

export const authApi = {
  login: async (email: string, password: string) => {
    if (DEMO) {
      const { DEMO_USERS } = await import("./demo-fixtures")
      const match = DEMO_USERS[email]
      if (match && match.password === password) {
        return { data: { access_token: match.tokens.access_token, user: match.user } }
      }
      throw new Error("Invalid credentials")
    }
    return apiClient.post("/auth/login", { email, password })
  },
  me: async () => {
    return apiClient.get("/auth/me")
  },
}

export const publicApi = {
  report: async (data: any) => {
    if (DEMO) return { data: { incident_number: `TRK-${Date.now()}`, status: "reported", message: "Your report has been received. Help is on the way." } }
    return apiClient.post("/public/report", data)
  },
}
