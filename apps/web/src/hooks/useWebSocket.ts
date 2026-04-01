import { useEffect, useRef, useCallback } from "react"
import { useAmbulanceStore } from "../store/ambulanceStore"
import { useIncidentStore } from "../store/incidentStore"
import { useHospitalStore } from "../store/hospitalStore"
import { useNotificationStore } from "../store/notificationStore"

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000"
const DEMO = import.meta.env.VITE_DEMO_MODE === "true"

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()

  const updateAmbulancePosition = useAmbulanceStore((s: any) => s.updatePosition)
  const addIncident = useIncidentStore((s: any) => s.addIncident)
  const updateIncidentStatus = useIncidentStore((s: any) => s.updateStatus)
  const updateHospitalResources = useHospitalStore((s: any) => s.updateResources)
  const addNotification = useNotificationStore((s: any) => s.add)

  const connect = useCallback(() => {
    if (DEMO) {
      simulateDemoWebSocket({ updateAmbulancePosition, addIncident, updateIncidentStatus, addNotification })
      return
    }
    const token = localStorage.getItem("access_token")
    if (!token) return
    try {
      ws.current = new WebSocket(`${WS_URL}/ws/command?token=${token}`)
      ws.current.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        handleMessage(msg, { updateAmbulancePosition, addIncident, updateIncidentStatus, updateHospitalResources, addNotification })
      }
      ws.current.onclose = () => {
        reconnectTimer.current = setTimeout(connect, 3000)
      }
      ws.current.onerror = () => {
        ws.current?.close()
      }
    } catch (e) {
      reconnectTimer.current = setTimeout(connect, 5000)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [connect])
}

function handleMessage(msg: any, handlers: any) {
  const { updateAmbulancePosition, addIncident, updateIncidentStatus, updateHospitalResources, addNotification } = handlers
  switch (msg.type) {
    case "AMBULANCE_LOCATION":
      updateAmbulancePosition(msg.ambulance_id, msg.lat, msg.lon, msg.status)
      break
    case "NEW_INCIDENT":
      addIncident(msg.incident)
      addNotification({ message: `New incident: ${msg.incident.incident_number} — ${msg.incident.severity}`, severity: "HIGH", is_read: false, id: crypto.randomUUID(), created_at: new Date().toISOString() })
      break
    case "INCIDENT_STATUS":
      updateIncidentStatus(msg.incident_id, msg.status)
      break
    case "HOSPITAL_UPDATE":
      updateHospitalResources(msg.hospital_id, { icu_beds_available: msg.icu_available, ed_capacity_current: msg.ed_current })
      break
    case "ALERT":
      addNotification({ message: msg.message, severity: msg.severity || "HIGH", is_read: false, id: crypto.randomUUID(), created_at: new Date().toISOString() })
      break
  }
}

const KERALA_ROUTES: Record<string, [number, number][]> = {
  "amb-001": [[9.9312, 76.2673], [9.9412, 76.2773], [9.9512, 76.2873], [9.9612, 76.2973]],
  "amb-003": [[10.5276, 76.2144], [10.5300, 76.2200], [10.5320, 76.2250], [10.5276, 76.2144]],
  "amb-004": [[8.5000, 76.9500], [8.5050, 76.9550], [8.5100, 76.9600], [8.5000, 76.9500]],
}

function simulateDemoWebSocket(handlers: any) {
  const { updateAmbulancePosition, addNotification } = handlers
  const positions: Record<string, number> = {}
  setInterval(() => {
    Object.entries(KERALA_ROUTES).forEach(([ambId, route]) => {
      positions[ambId] = ((positions[ambId] || 0) + 1) % route.length
      const [lat, lon] = route[positions[ambId]]
      updateAmbulancePosition(ambId, lat + (Math.random() - 0.5) * 0.001, lon + (Math.random() - 0.5) * 0.001, "EN_ROUTE")
    })
  }, 4000)
  setTimeout(() => {
    addNotification({ message: "Response SLA breach: Incident TRK-20240312-003 — No ambulance dispatched in 5 min", severity: "HIGH", is_read: false, id: crypto.randomUUID(), created_at: new Date().toISOString() })
  }, 8000)
  setTimeout(() => {
    addNotification({ message: "ICU capacity critical: GMC Kozhikode at 97% — only 2 beds available", severity: "HIGH", is_read: false, id: crypto.randomUUID(), created_at: new Date().toISOString() })
  }, 15000)
}
