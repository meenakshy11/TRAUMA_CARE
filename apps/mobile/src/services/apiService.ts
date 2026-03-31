import axios from "axios"
import { DEMO_MODE, DEMO_HOSPITALS, DEMO_ACTIVE_INCIDENT } from "../demo/demoData"

const BASE_URL = "http://localhost:8000/api/v1"

const client = axios.create({ baseURL: BASE_URL, timeout: 10000 })

let authToken = ""
export const setToken = (token: string) => { authToken = token }

client.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`
  return config
})

export const api = {
  login: async (email: string, password: string) => {
    if (DEMO_MODE) {
      return { user: { id: "u-001", email, full_name: "Rajan Pillai", role: "PARAMEDIC", ambulance_id: "amb-001" }, access_token: "demo-token" }
    }
    const res = await client.post("/auth/login", { email, password })
    return res.data
  },

  createIncident: async (data: any) => {
    if (DEMO_MODE) {
      return {
        id: `inc-${Date.now()}`,
        incident_number: `TRK-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
        status: "REPORTED",
        ...data,
        created_at: new Date().toISOString(),
      }
    }
    const res = await client.post("/incidents", data)
    return res.data
  },

  updateStatus: async (incidentId: string, status: string) => {
    if (DEMO_MODE) return { id: incidentId, status }
    const res = await client.patch(`/incidents/${incidentId}/status`, { status })
    return res.data
  },

  addPatient: async (incidentId: string, data: any) => {
    if (DEMO_MODE) return { id: `pat-${Date.now()}`, incident_id: incidentId, ...data }
    const res = await client.post(`/incidents/${incidentId}/patients`, data)
    return res.data
  },

  recordVitals: async (patientId: string, data: any) => {
    if (DEMO_MODE) return { status: "recorded" }
    const res = await client.post(`/patients/${patientId}/vitals`, data)
    return res.data
  },

  recordTriage: async (patientId: string, data: any) => {
    if (DEMO_MODE) {
      const { is_breathing, respirations_ok, perfusion_ok, mental_status_ok } = data
      let color = "GREEN"
      if (!is_breathing) color = "BLACK"
      else if (!respirations_ok || !perfusion_ok || !mental_status_ok) color = "RED"
      else color = "YELLOW"
      return { triage_color: color, protocol: "START" }
    }
    const res = await client.post(`/patients/${patientId}/triage`, data)
    return res.data
  },

  getHospitals: async () => {
    if (DEMO_MODE) return DEMO_HOSPITALS
    const res = await client.get("/hospitals")
    return res.data
  },

  pushLocation: async (ambulanceId: string, lat: number, lon: number) => {
    if (DEMO_MODE) return { status: "ok" }
    await client.post(`/ambulances/${ambulanceId}/location`, { latitude: lat, longitude: lon })
  },
}
