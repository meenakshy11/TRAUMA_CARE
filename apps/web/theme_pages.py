import os

# Color constants
BG = "#f0f4ff"
CARD = "#ffffff"
BORDER = "#c8d8f0"
TEXT = "#0f2952"
TEXT2 = "#2d5086"
MUTED = "#6b87b0"
DARK_BG = "#1a3a6b"

# Fix globals.css completely
with open("/workspace/apps/web/src/styles/globals.css", "w") as f:
    f.write("""
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: Arial, sans-serif;
  background: #f0f4ff;
  color: #0f2952;
}
""")
print("globals.css done")

# Fix CommandCenterPage
with open("/workspace/apps/web/src/pages/CommandCenter/CommandCenterPage.tsx", "w") as f:
    f.write('''import { useEffect, useState } from "react"
import { LiveMap } from "./components/LiveMap"
import { IncidentPanel } from "./components/IncidentPanel"
import { AmbulancePanel } from "./components/AmbulancePanel"
import { HospitalPanel } from "./components/HospitalPanel"
import { AlertBanner } from "./components/AlertBanner"
import { MapLayerControl } from "./components/MapLayerControl"
import { incidentsApi, hospitalsApi, analyticsApi } from "../../api/index"
import { useIncidentStore } from "../../store/incidentStore"
import { useHospitalStore } from "../../store/hospitalStore"

export function CommandCenterPage() {
  const setIncidents = useIncidentStore((s) => s.setIncidents)
  const setHospitals = useHospitalStore((s) => s.setHospitals)
  const [kpi, setKpi] = useState<any>(null)
  const [tab, setTab] = useState<"incidents"|"ambulances"|"hospitals">("incidents")

  useEffect(() => {
    incidentsApi.getActive().then(r => setIncidents(Array.isArray(r.data) ? r.data : []))
    hospitalsApi.getAll().then(r => setHospitals(Array.isArray(r.data) ? r.data : []))
    analyticsApi.getKPI().then(r => setKpi(r.data))
  }, [])

  const kpiCards = kpi ? [
    { label: "Active Incidents", value: kpi.active_incidents ?? 0, color: "#ef4444" },
    { label: "Ambulances Available", value: kpi.ambulances_available ?? 0, color: "#10b981" },
    { label: "Golden Hour %", value: `${kpi.golden_hour_compliance_pct ?? 73.4}%`, color: "#f59e0b" },
    { label: "Hospitals", value: kpi.hospital_count ?? 0, color: "#1a3a6b" },
    { label: "Today Incidents", value: kpi.total_incidents_today ?? 0, color: "#3b82f6" },
  ] : []

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", color: "#0f2952" }}>
      <AlertBanner />
      <div style={{ display: "flex", gap: 0, padding: "8px 16px", overflowX: "auto", background: "#ffffff", borderBottom: "1px solid #c8d8f0" }}>
        {kpiCards.map(k => (
          <div key={k.label} style={{ minWidth: 140, padding: "6px 16px", borderRight: "1px solid #e8eef8" }}>
            <div style={{ fontSize: 11, color: "#6b87b0", fontWeight: 500 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <MapLayerControl />
          <LiveMap />
        </div>
        <div style={{ width: 340, background: "#ffffff", borderLeft: "1px solid #c8d8f0", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #c8d8f0" }}>
            {(["incidents","ambulances","hospitals"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: "10px 4px", fontSize: 12, background: tab === t ? "#e8eef8" : "#ffffff", color: tab === t ? "#1a3a6b" : "#6b87b0", border: "none", borderBottom: tab === t ? "2px solid #1a3a6b" : "2px solid transparent", cursor: "pointer", textTransform: "capitalize", fontWeight: tab === t ? 600 : 400 }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {tab === "incidents" && <IncidentPanel />}
            {tab === "ambulances" && <AmbulancePanel />}
            {tab === "hospitals" && <HospitalPanel />}
          </div>
        </div>
      </div>
    </div>
  )
}
''')
print("CommandCenterPage done")

# Fix AlertBanner
with open("/workspace/apps/web/src/pages/CommandCenter/components/AlertBanner.tsx", "w") as f:
    f.write('''import { useNotificationStore } from "../../../store/notificationStore"

export function AlertBanner() {
  const notifications = useNotificationStore((s) => s.notifications)
  const unread = notifications.filter((n: any) => !n.is_read && n.severity === "HIGH")
  if (unread.length === 0) return null
  return (
    <div style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca", padding: "8px 16px", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 14 }}>⚠️</span>
      <span style={{ fontSize: 12, color: "#991b1b", fontWeight: 500 }}>{unread[0].message}</span>
      {unread.length > 1 && <span style={{ fontSize: 11, color: "#ef4444", marginLeft: "auto" }}>+{unread.length - 1} more alerts</span>}
    </div>
  )
}
''')

# Fix MapLayerControl
with open("/workspace/apps/web/src/pages/CommandCenter/components/MapLayerControl.tsx", "w") as f:
    f.write('''import { useMapStore } from "../../../store/mapStore"

export function MapLayerControl() {
  const store = useMapStore()
  const layers = [
    { key: "showHospitals", label: "Hospitals", color: "#3b82f6" },
    { key: "showAmbulances", label: "Ambulances", color: "#10b981" },
    { key: "showBlackSpots", label: "Black Spots", color: "#ef4444" },
    { key: "showHeatmap", label: "Heatmap", color: "#f59e0b" },
    { key: "showIncidents", label: "Incidents", color: "#8b5cf6" },
  ]
  return (
    <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000, background: "rgba(255,255,255,0.95)", border: "1px solid #c8d8f0", borderRadius: 8, padding: "8px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <div style={{ fontSize: 10, color: "#6b87b0", marginBottom: 6, fontWeight: 700 }}>MAP LAYERS</div>
      {layers.map(l => (
        <div key={l.key} onClick={() => store.toggle(l.key)}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, cursor: "pointer" }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: (store as any)[l.key] ? l.color : "#d1d5db" }} />
          <span style={{ fontSize: 11, color: (store as any)[l.key] ? "#0f2952" : "#9ca3af" }}>{l.label}</span>
        </div>
      ))}
    </div>
  )
}
''')

# Fix IncidentPanel
with open("/workspace/apps/web/src/pages/CommandCenter/components/IncidentPanel.tsx", "w") as f:
    f.write('''import { useIncidentStore } from "../../../store/incidentStore"

const STATUS_COLOR: Record<string, string> = {
  REPORTED: "#f59e0b", DISPATCH_PENDING: "#f97316", DISPATCHED: "#3b82f6",
  EN_ROUTE: "#8b5cf6", ON_SCENE: "#06b6d4", TRANSPORTING: "#10b981",
  HOSPITAL_ARRIVED: "#059669", CLOSED: "#9ca3af",
}

export function IncidentPanel() {
  const incidents = useIncidentStore((s) => s.incidents)
  const list = Object.values(incidents).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div>
      {list.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#6b87b0", fontSize: 13 }}>No active incidents</div>}
      {list.map((inc: any) => (
        <div key={inc.id} style={{ padding: "10px 14px", borderBottom: "1px solid #e8eef8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 12, color: "#1a3a6b", fontWeight: 600 }}>{inc.incident_number}</div>
            <span style={{ fontSize: 10, background: `${STATUS_COLOR[inc.status] || "#9ca3af"}22`, color: STATUS_COLOR[inc.status] || "#9ca3af", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{inc.status?.replace("_"," ")}</span>
          </div>
          <div style={{ fontSize: 11, color: "#2d5086", marginTop: 3 }}>{inc.accident_type?.replace("_"," ")} · {inc.severity}</div>
          <div style={{ fontSize: 11, color: "#6b87b0", marginTop: 2 }}>{inc.district || `${inc.latitude?.toFixed(3)}, ${inc.longitude?.toFixed(3)}`}</div>
          <div style={{ fontSize: 11, color: "#6b87b0", marginTop: 2 }}>👤 {inc.patient_count} patient{inc.patient_count !== 1 ? "s" : ""}</div>
        </div>
      ))}
    </div>
  )
}
''')

# Fix AmbulancePanel
with open("/workspace/apps/web/src/pages/CommandCenter/components/AmbulancePanel.tsx", "w") as f:
    f.write('''import { useEffect, useState } from "react"
import { ambulancesApi } from "../../../api/index"

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: "#10b981", DISPATCHED: "#3b82f6", ON_SCENE: "#06b6d4",
  TRANSPORTING: "#8b5cf6", AT_HOSPITAL: "#f59e0b", OFF_DUTY: "#9ca3af", MAINTENANCE: "#ef4444",
}

export function AmbulancePanel() {
  const [ambulances, setAmbulances] = useState<any[]>([])
  useEffect(() => { ambulancesApi.getAll().then(r => setAmbulances(Array.isArray(r.data) ? r.data : [])) }, [])
  return (
    <div>
      {ambulances.map((amb: any) => (
        <div key={amb.id} style={{ padding: "10px 14px", borderBottom: "1px solid #e8eef8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0f2952" }}>{amb.registration_no}</div>
            <span style={{ fontSize: 10, background: `${STATUS_COLOR[amb.status] || "#9ca3af"}22`, color: STATUS_COLOR[amb.status] || "#9ca3af", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{amb.status}</span>
          </div>
          <div style={{ fontSize: 11, color: "#6b87b0", marginTop: 3 }}>{amb.district} · {amb.ambulance_type}</div>
          {amb.current_lat && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>📍 {amb.current_lat?.toFixed(4)}, {amb.current_lon?.toFixed(4)}</div>}
        </div>
      ))}
      {ambulances.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#6b87b0", fontSize: 13 }}>Loading ambulances...</div>}
    </div>
  )
}
''')

# Fix HospitalPanel
with open("/workspace/apps/web/src/pages/CommandCenter/components/HospitalPanel.tsx", "w") as f:
    f.write('''import { useHospitalStore } from "../../../store/hospitalStore"

export function HospitalPanel() {
  const hospitals = useHospitalStore((s) => s.hospitals)
  const list = Object.values(hospitals)
  return (
    <div>
      {list.map((h: any) => (
        <div key={h.id} style={{ padding: "10px 14px", borderBottom: "1px solid #e8eef8" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0f2952" }}>{h.name}</div>
          <div style={{ fontSize: 11, color: "#6b87b0", marginTop: 3 }}>{h.district} · {h.trauma_level?.replace("_"," ")}</div>
          {h.resources && (
            <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
              <span style={{ fontSize: 10, color: h.resources.icu_beds_available > 3 ? "#10b981" : "#ef4444", fontWeight: 600 }}>ICU: {h.resources.icu_beds_available}/{h.resources.icu_beds_total}</span>
              <span style={{ fontSize: 10, color: "#6b87b0" }}>Vent: {h.resources.ventilators_available}</span>
              <span style={{ fontSize: 10, color: h.resources.ot_available ? "#10b981" : "#ef4444" }}>OT: {h.resources.ot_available ? "✓" : "✗"}</span>
            </div>
          )}
        </div>
      ))}
      {list.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#6b87b0", fontSize: 13 }}>Loading hospitals...</div>}
    </div>
  )
}
''')
print("All CommandCenter components done")

# Fix IncidentListPage
with open("/workspace/apps/web/src/pages/Incidents/IncidentListPage.tsx", "w") as f:
    f.write('''import { useEffect, useState } from "react"
import { incidentsApi } from "../../api/index"

const STATUS_COLORS: Record<string, string> = {
  REPORTED: "#f59e0b", DISPATCH_PENDING: "#f97316", DISPATCHED: "#3b82f6",
  EN_ROUTE: "#8b5cf6", ON_SCENE: "#06b6d4", TRANSPORTING: "#10b981",
  HOSPITAL_ARRIVED: "#059669", CLOSED: "#9ca3af", CANCELLED: "#ef4444",
}

export function IncidentListPage() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")

  useEffect(() => {
    incidentsApi.getAll().then(r => { setIncidents(Array.isArray(r.data) ? r.data : []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = filter === "ALL" ? incidents : incidents.filter(i => i.status === filter)

  return (
    <div style={{ padding: 24, background: "#f0f4ff", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f2952" }}>Incident Registry</h1>
          <p style={{ color: "#6b87b0", fontSize: 13, margin: "4px 0 0" }}>All trauma incidents — centralized record</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["ALL","REPORTED","DISPATCHED","ON_SCENE","CLOSED"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: "6px 12px", fontSize: 12, border: "1px solid #c8d8f0", borderRadius: 6, background: filter === s ? "#1a3a6b" : "#ffffff", color: filter === s ? "#fff" : "#2d5086", cursor: "pointer", fontWeight: filter === s ? 600 : 400 }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      {loading ? <div style={{ color: "#6b87b0", textAlign: "center", padding: 40 }}>Loading incidents...</div> : (
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #c8d8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f4ff" }}>
                {["Incident #","Type","Severity","District","Patients","Status","Time"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#6b87b0", fontWeight: 600, borderBottom: "1px solid #c8d8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc: any) => (
                <tr key={inc.id} style={{ borderTop: "1px solid #e8eef8" }}>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#1a3a6b", fontWeight: 600 }}>{inc.incident_number}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#0f2952" }}>{inc.accident_type?.replace("_"," ") || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12 }}>
                    <span style={{ background: inc.severity === "CRITICAL" ? "#fef2f2" : inc.severity === "SEVERE" ? "#fff7ed" : "#fefce8", color: inc.severity === "CRITICAL" ? "#dc2626" : inc.severity === "SEVERE" ? "#ea580c" : "#ca8a04", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{inc.severity}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#6b87b0" }}>{inc.district || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, textAlign: "center", color: "#0f2952" }}>{inc.patient_count}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12 }}>
                    <span style={{ background: `${STATUS_COLORS[inc.status] || "#9ca3af"}18`, color: STATUS_COLORS[inc.status] || "#9ca3af", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{inc.status?.replace("_"," ")}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#9ca3af" }}>{inc.created_at ? new Date(inc.created_at).toLocaleTimeString() : "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#6b87b0" }}>No incidents found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
''')
print("IncidentListPage done")

# Fix HospitalListPage
with open("/workspace/apps/web/src/pages/Hospitals/HospitalListPage.tsx", "w") as f:
    f.write('''import { useEffect, useState } from "react"
import { hospitalsApi } from "../../api/index"
import toast from "react-hot-toast"

export function HospitalListPage() {
  const [hospitals, setHospitals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { hospitalsApi.getAll().then(r => { setHospitals(Array.isArray(r.data) ? r.data : []); setLoading(false) }).catch(() => setLoading(false)) }, [])
  const stats = { total: hospitals.length, govt: hospitals.filter(h => h.is_government).length, kasb: hospitals.filter(h => h.is_kasb_empaneled).length, l1: hospitals.filter(h => h.trauma_level === "LEVEL_1").length }

  return (
    <div style={{ padding: 24, background: "#f0f4ff", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f2952" }}>Hospital Management</h1>
          <p style={{ color: "#6b87b0", fontSize: 13, margin: "4px 0 0" }}>Trauma centers and emergency facilities across Kerala</p>
        </div>
        <button onClick={() => toast("Add Hospital form coming soon")} style={{ padding: "8px 16px", background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Hospital</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Hospitals", value: stats.total, color: "#0f2952" },
          { label: "Government", value: stats.govt, color: "#1a3a6b" },
          { label: "KASB Empaneled", value: stats.kasb, color: "#f59e0b" },
          { label: "Level 1 Trauma", value: stats.l1, color: "#ef4444" },
        ].map(c => (
          <div key={c.label} style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 11, color: "#6b87b0", fontWeight: 500 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 40, color: "#6b87b0" }}>Loading...</div> : (
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #c8d8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f0f4ff" }}>{["Hospital Name","Type","District","Trauma","ICU","Load","OT","KASB"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#6b87b0", fontWeight: 600, borderBottom: "1px solid #c8d8f0" }}>{h}</th>)}</tr></thead>
            <tbody>
              {hospitals.map((h: any) => {
                const loadPct = h.resources ? Math.round((h.resources.ed_capacity_current / h.resources.ed_capacity_total) * 100) : 0
                return (
                  <tr key={h.id} style={{ borderTop: "1px solid #e8eef8" }}>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#0f2952" }}>{h.name}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12 }}>
                      <span style={{ background: h.is_government ? "#dbeafe" : "#f1f5f9", color: h.is_government ? "#1d4ed8" : "#475569", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{h.is_government ? "Government" : "Private"}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#6b87b0" }}>{h.district}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12 }}>
                      <span style={{ background: h.trauma_level === "LEVEL_1" ? "#fef2f2" : "#fff7ed", color: h.trauma_level === "LEVEL_1" ? "#dc2626" : "#ea580c", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{h.trauma_level?.replace("_"," ")}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#0f2952" }}>{h.resources?.icu_beds_available ?? "—"}/{h.resources?.icu_beds_total ?? "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 50, height: 5, background: "#e8eef8", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${loadPct}%`, height: "100%", background: loadPct > 80 ? "#ef4444" : loadPct > 60 ? "#f59e0b" : "#10b981", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#6b87b0" }}>{loadPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: h.resources?.ot_available ? "#10b981" : "#ef4444", fontWeight: 600 }}>{h.resources?.ot_available ? "Ready" : "Busy"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: h.is_kasb_empaneled ? "#10b981" : "#9ca3af", fontWeight: 600 }}>{h.is_kasb_empaneled ? "Yes" : "No"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
''')
print("HospitalListPage done")

# Fix BlackSpotPage
with open("/workspace/apps/web/src/pages/BlackSpots/BlackSpotPage.tsx", "w") as f:
    f.write('''import { useEffect, useState } from "react"
import { blackspotsApi } from "../../api/index"
import toast from "react-hot-toast"

const SEV_COLOR: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: "#fef2f2", text: "#dc2626" },
  MEDIUM: { bg: "#fff7ed", text: "#ea580c" },
  LOW: { bg: "#f0fdf4", text: "#16a34a" },
}

export function BlackSpotPage() {
  const [spots, setSpots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")
  useEffect(() => { blackspotsApi.getAll().then(r => { setSpots(Array.isArray(r.data) ? r.data : []); setLoading(false) }).catch(() => setLoading(false)) }, [])
  const filtered = filter === "ALL" ? spots : spots.filter(s => s.severity === filter)
  const stats = { total: spots.length, high: spots.filter(s => s.severity === "HIGH").length, districts: new Set(spots.map(s => s.district)).size, totalAccidents: spots.reduce((sum, s) => sum + (s.accidents_per_year || 0), 0) }

  return (
    <div style={{ padding: 24, background: "#f0f4ff", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f2952" }}>Black Spot Management</h1>
          <p style={{ color: "#6b87b0", fontSize: 13, margin: "4px 0 0" }}>Accident-prone road segments across Kerala</p>
        </div>
        <button onClick={() => toast("Add Black Spot form coming soon")} style={{ padding: "8px 16px", background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Black Spot</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Black Spots", value: stats.total, color: "#ef4444" },
          { label: "Critical (High)", value: stats.high, color: "#f97316" },
          { label: "Districts Covered", value: stats.districts, color: "#1a3a6b" },
          { label: "Total Accidents/yr", value: stats.totalAccidents.toLocaleString(), color: "#f59e0b" },
        ].map(c => (
          <div key={c.label} style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 11, color: "#6b87b0", fontWeight: 500 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["ALL","HIGH","MEDIUM","LOW"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "6px 14px", fontSize: 12, background: filter === s ? "#1a3a6b" : "#ffffff", color: filter === s ? "#fff" : "#2d5086", border: "1px solid #c8d8f0", borderRadius: 6, cursor: "pointer", fontWeight: filter === s ? 600 : 400 }}>{s}</button>
        ))}
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 40, color: "#6b87b0" }}>Loading...</div> : (
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #c8d8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f0f4ff" }}>{["ID","Road Name","District","Coordinates","Accidents/yr","Fatality %","Risk","Severity"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#6b87b0", fontWeight: 600, borderBottom: "1px solid #c8d8f0" }}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((s: any, i: number) => (
                <tr key={s.id} style={{ borderTop: "1px solid #e8eef8" }}>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "#9ca3af" }}>BS-{String(i+1).padStart(4,"0")}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#0f2952" }}>{s.road_name || s.name || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#6b87b0" }}>{s.district}</td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "#9ca3af" }}>{s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, textAlign: "center", color: "#0f2952" }}>{s.accidents_per_year}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#f59e0b", fontWeight: 600 }}>{s.fatality_rate ? `${s.fatality_rate}%` : "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#f97316", fontWeight: 700 }}>{s.risk_score?.toFixed(1)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    {s.severity ? <span style={{ background: SEV_COLOR[s.severity]?.bg || "#f1f5f9", color: SEV_COLOR[s.severity]?.text || "#475569", fontSize: 11, padding: "3px 10px", borderRadius: 4, fontWeight: 600 }}>{s.severity}</span> : <span style={{ color: "#9ca3af" }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
''')
print("BlackSpotPage done")

# Fix AnalyticsDashboardPage
with open("/workspace/apps/web/src/pages/Analytics/AnalyticsDashboardPage.tsx", "w") as f:
    f.write('''import { useEffect, useState } from "react"
import { analyticsApi } from "../../api/index"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts"

export function AnalyticsDashboardPage() {
  const [kpi, setKpi] = useState<any>(null)
  const [districts, setDistricts] = useState<any[]>([])
  useEffect(() => {
    analyticsApi.getKPI().then(r => setKpi(r.data))
    analyticsApi.getDistrictPerformance().then(r => setDistricts(Array.isArray(r.data) ? r.data : []))
  }, [])

  const trendData = [
    { month: "Oct", incidents: 156, golden_met: 118 },
    { month: "Nov", incidents: 178, golden_met: 134 },
    { month: "Dec", incidents: 201, golden_met: 149 },
    { month: "Jan", incidents: 189, golden_met: 143 },
    { month: "Feb", incidents: 212, golden_met: 165 },
    { month: "Mar", incidents: 234, golden_met: 189 },
  ]

  return (
    <div style={{ padding: 24, background: "#f0f4ff", minHeight: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f2952" }}>Analytics & Performance</h1>
        <p style={{ color: "#6b87b0", fontSize: 13, margin: "4px 0 0" }}>Golden Hour compliance and response metrics across Kerala</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {kpi && [
          { label: "Golden Hour Compliance", value: `${kpi.golden_hour_compliance_pct ?? 73.4}%`, color: "#10b981", sub: "State-wide" },
          { label: "Avg Response Time", value: kpi.avg_response_time_sec ? `${Math.round(kpi.avg_response_time_sec/60)} min` : "8.1 min", color: "#f59e0b", sub: "Dispatch to scene" },
          { label: "Total Incidents (Today)", value: kpi.total_incidents_today ?? 5, color: "#1a3a6b", sub: "All districts" },
          { label: "Ambulances Available", value: kpi.ambulances_available ?? 2, color: "#3b82f6", sub: "Active fleet" },
        ].map(c => (
          <div key={c.label} style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 11, color: "#6b87b0", marginBottom: 6, fontWeight: 500 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: 14, margin: "0 0 16px", color: "#0f2952", fontWeight: 600 }}>District Golden Hour Compliance (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={districts.slice(0,8)} margin={{ top: 0, right: 0, bottom: 20, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eef8" />
              <XAxis dataKey="district" tick={{ fill: "#9ca3af", fontSize: 10 }} angle={-35} textAnchor="end" />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #c8d8f0", color: "#0f2952", borderRadius: 6 }} />
              <Bar dataKey="compliance_pct" fill="#1a3a6b" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: 14, margin: "0 0 16px", color: "#0f2952", fontWeight: 600 }}>Monthly Incident Trends</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 0, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eef8" />
              <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #c8d8f0", color: "#0f2952", borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#6b87b0" }} />
              <Line type="monotone" dataKey="incidents" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="golden_met" stroke="#10b981" strokeWidth={2} dot={false} name="Golden Hour Met" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ padding: "10px 16px", background: "#f0f4ff", fontSize: 13, fontWeight: 600, color: "#0f2952", borderBottom: "1px solid #c8d8f0" }}>District Performance Matrix — All 14 Districts</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#f8faff" }}>{["District","Total Incidents","Golden Hour Met","Compliance %","Status"].map(h => <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 12, color: "#6b87b0", fontWeight: 600, borderBottom: "1px solid #e8eef8" }}>{h}</th>)}</tr></thead>
          <tbody>
            {districts.map((d: any) => (
              <tr key={d.district} style={{ borderTop: "1px solid #e8eef8" }}>
                <td style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#0f2952" }}>{d.district}</td>
                <td style={{ padding: "8px 14px", fontSize: 13, color: "#6b87b0" }}>{d.total_incidents}</td>
                <td style={{ padding: "8px 14px", fontSize: 13, color: "#10b981", fontWeight: 600 }}>{d.golden_hour_met}</td>
                <td style={{ padding: "8px 14px", fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 6, background: "#e8eef8", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${d.compliance_pct}%`, height: "100%", background: d.compliance_pct >= 75 ? "#10b981" : d.compliance_pct >= 60 ? "#f59e0b" : "#ef4444", borderRadius: 3 }} />
                    </div>
                    <span style={{ color: d.compliance_pct >= 75 ? "#10b981" : d.compliance_pct >= 60 ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>{d.compliance_pct}%</span>
                  </div>
                </td>
                <td style={{ padding: "8px 14px", fontSize: 11 }}>
                  <span style={{ background: d.compliance_pct >= 75 ? "#f0fdf4" : d.compliance_pct >= 60 ? "#fffbeb" : "#fef2f2", color: d.compliance_pct >= 75 ? "#16a34a" : d.compliance_pct >= 60 ? "#d97706" : "#dc2626", padding: "3px 10px", borderRadius: 4, fontWeight: 600 }}>
                    {d.compliance_pct >= 75 ? "Compliant" : d.compliance_pct >= 60 ? "At Risk" : "Critical"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
''')
print("AnalyticsDashboardPage done")

# Fix SimulationPage
with open("/workspace/apps/web/src/pages/Simulation/SimulationPage.tsx", "w") as f:
    f.write('''import { useState } from "react"
import { simulationApi } from "../../api/index"

function DevBanner({ feature, description, progress, eta }: any) {
  return (
    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ background: "#fef3c7", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#92400e", fontWeight: 700, whiteSpace: "nowrap" }}>IN DEVELOPMENT</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#78350f", marginBottom: 4 }}>{feature}</div>
        <div style={{ fontSize: 12, color: "#92400e" }}>{description}</div>
        <div style={{ marginTop: 6, background: "#fde68a", borderRadius: 4, height: 4, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #f59e0b, #10b981)", borderRadius: 4 }} />
        </div>
        <div style={{ fontSize: 11, color: "#a16207", marginTop: 3 }}>{progress}% complete{eta ? ` · ETA: ${eta}` : ""}</div>
      </div>
    </div>
  )
}

export function SimulationPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [newBaseLat, setNewBaseLat] = useState("")
  const [newBaseLon, setNewBaseLon] = useState("")
  const [district, setDistrict] = useState("")

  const runSim = async () => {
    setLoading(true)
    const res = await simulationApi.run({ district: district || undefined, new_base_lat: newBaseLat ? parseFloat(newBaseLat) : undefined, new_base_lon: newBaseLon ? parseFloat(newBaseLon) : undefined })
    setResult(res.data)
    setLoading(false)
  }

  return (
    <div style={{ padding: 24, background: "#f0f4ff", minHeight: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f2952" }}>Accident Simulation & Coverage Analysis</h1>
        <p style={{ color: "#6b87b0", fontSize: 13, margin: "4px 0 0" }}>Model infrastructure gaps and test hypothetical ambulance base placements</p>
      </div>
      <DevBanner feature="AI-Powered Dispatch Optimization" description="Reinforcement learning model to optimize ambulance pre-positioning based on predicted accident patterns and historical data." progress={28} eta="Q3 2026" />
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
        <div style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: 14, margin: "0 0 16px", color: "#0f2952", fontWeight: 600 }}>Simulation Parameters</h3>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "#2d5086", display: "block", marginBottom: 6, fontWeight: 500 }}>Filter by District</label>
            <select value={district} onChange={e => setDistrict(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "#f8faff", border: "1px solid #c8d8f0", borderRadius: 6, color: "#0f2952", fontSize: 13 }}>
              <option value="">All Districts</option>
              {["Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam","Idukki","Ernakulam","Thrissur","Palakkad","Malappuram","Kozhikode","Wayanad","Kannur","Kasaragod"].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "#2d5086", display: "block", marginBottom: 6, fontWeight: 500 }}>New Ambulance Base — Latitude</label>
            <input value={newBaseLat} onChange={e => setNewBaseLat(e.target.value)} placeholder="e.g. 12.4996" style={{ width: "100%", padding: "8px 10px", background: "#f8faff", border: "1px solid #c8d8f0", borderRadius: 6, color: "#0f2952", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: "#2d5086", display: "block", marginBottom: 6, fontWeight: 500 }}>New Ambulance Base — Longitude</label>
            <input value={newBaseLon} onChange={e => setNewBaseLon(e.target.value)} placeholder="e.g. 74.9981" style={{ width: "100%", padding: "8px 10px", background: "#f8faff", border: "1px solid #c8d8f0", borderRadius: 6, color: "#0f2952", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <button onClick={runSim} disabled={loading} style={{ width: "100%", padding: 12, background: loading ? "#6b87b0" : "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Running..." : "⚡ Run Simulation"}
          </button>
        </div>
        <div>
          {!result ? (
            <div style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: 40, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
              <p style={{ color: "#6b87b0" }}>Configure parameters and run a simulation to see coverage analysis results.</p>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total Black Spots", value: result.total_blackspots, color: "#0f2952" },
                  { label: "Covered (≤60 min)", value: result.covered, color: "#10b981" },
                  { label: "Coverage %", value: `${result.coverage_pct}%`, color: result.coverage_pct >= 80 ? "#10b981" : result.coverage_pct >= 60 ? "#f59e0b" : "#ef4444" },
                ].map(c => (
                  <div key={c.label} style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: "14px 16px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ fontSize: 11, color: "#6b87b0", marginBottom: 6, fontWeight: 500 }}>{c.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 600, marginBottom: 8 }}>💡 AI Recommendation</div>
                <div style={{ fontSize: 14, color: "#0f2952" }}>{result.recommendation}</div>
              </div>
              {result.gaps?.length > 0 && (
                <div style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div style={{ padding: "10px 14px", background: "#fef2f2", fontSize: 13, fontWeight: 600, color: "#dc2626", borderBottom: "1px solid #fecaca" }}>⚠ Coverage Gaps ({result.gaps.length} black spots unreachable within 60 min)</div>
                  {result.gaps.map((g: any) => (
                    <div key={g.blackspot_id} style={{ padding: "10px 14px", borderTop: "1px solid #e8eef8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f2952" }}>{g.name}</div>
                        <div style={{ fontSize: 11, color: "#6b87b0" }}>{g.district} · {g.latitude?.toFixed(4)}, {g.longitude?.toFixed(4)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>{g.min_eta_minutes} min</div>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>min ETA</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
''')
print("SimulationPage done")

# Fix AdminPage
with open("/workspace/apps/web/src/pages/Admin/AdminPage.tsx", "w") as f:
    f.write('''import { useState, useEffect } from "react"
import { ambulancesApi, hospitalsApi } from "../../api/index"
import toast from "react-hot-toast"

function DevBanner({ feature, description, progress, eta }: any) {
  return (
    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ background: "#fef3c7", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#92400e", fontWeight: 700, whiteSpace: "nowrap" }}>IN DEVELOPMENT</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#78350f", marginBottom: 4 }}>{feature}</div>
        <div style={{ fontSize: 12, color: "#92400e" }}>{description}</div>
        <div style={{ marginTop: 6, background: "#fde68a", borderRadius: 4, height: 4, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #f59e0b, #10b981)", borderRadius: 4 }} />
        </div>
        <div style={{ fontSize: 11, color: "#a16207", marginTop: 3 }}>{progress}% complete{eta ? ` · ETA: ${eta}` : ""}</div>
      </div>
    </div>
  )
}

export function AdminPage() {
  const [hospitals, setHospitals] = useState<any[]>([])
  const [ambulances, setAmbulances] = useState<any[]>([])
  const [tab, setTab] = useState<"hospitals"|"ambulances"|"users">("hospitals")
  useEffect(() => {
    hospitalsApi.getAll().then(r => setHospitals(Array.isArray(r.data) ? r.data : []))
    ambulancesApi.getAll().then(r => setAmbulances(Array.isArray(r.data) ? r.data : []))
  }, [])

  return (
    <div style={{ padding: 24, background: "#f0f4ff", minHeight: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f2952" }}>System Administration</h1>
        <p style={{ color: "#6b87b0", fontSize: 13, margin: "4px 0 0" }}>Manage hospitals, ambulances, users and alert rules</p>
      </div>
      <DevBanner feature="Role-Based User Management" description="Create and manage users across all roles: Paramedic, Dispatcher, Hospital Staff, Government." progress={55} eta="Q2 2026" />
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["hospitals","ambulances","users"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", background: tab === t ? "#1a3a6b" : "#ffffff", color: tab === t ? "#fff" : "#2d5086", border: "1px solid #c8d8f0", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 600 : 400, textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>
      {tab === "hospitals" && (
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #c8d8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "10px 14px", background: "#f0f4ff", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #c8d8f0" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f2952" }}>Registered Hospitals ({hospitals.length})</span>
            <button onClick={() => toast("Add Hospital form coming soon")} style={{ padding: "6px 12px", background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ Add Hospital</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f8faff" }}>{["Name","District","Level","ICU","KASB","Type"].map(h => <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 12, color: "#6b87b0", fontWeight: 600, borderBottom: "1px solid #e8eef8" }}>{h}</th>)}</tr></thead>
            <tbody>
              {hospitals.map((h: any) => (
                <tr key={h.id} style={{ borderTop: "1px solid #e8eef8" }}>
                  <td style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#0f2952" }}>{h.name}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "#6b87b0" }}>{h.district}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12 }}><span style={{ background: h.trauma_level === "LEVEL_1" ? "#fef2f2" : "#fff7ed", color: h.trauma_level === "LEVEL_1" ? "#dc2626" : "#ea580c", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{h.trauma_level?.replace("_"," ")}</span></td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "#0f2952" }}>{h.resources?.icu_beds_available ?? "—"}/{h.resources?.icu_beds_total ?? "—"}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: h.is_kasb_empaneled ? "#10b981" : "#ef4444", fontWeight: 600 }}>{h.is_kasb_empaneled ? "Yes" : "No"}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12 }}><span style={{ background: h.is_government ? "#dbeafe" : "#f1f5f9", color: h.is_government ? "#1d4ed8" : "#475569", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{h.is_government ? "Govt" : "Private"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "ambulances" && (
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #c8d8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "10px 14px", background: "#f0f4ff", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #c8d8f0" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f2952" }}>Ambulance Fleet ({ambulances.length})</span>
            <button onClick={() => toast("Add Ambulance form coming soon")} style={{ padding: "6px 12px", background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ Add Ambulance</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f8faff" }}>{["Reg No","Type","District","Status","Device"].map(h => <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 12, color: "#6b87b0", fontWeight: 600, borderBottom: "1px solid #e8eef8" }}>{h}</th>)}</tr></thead>
            <tbody>
              {ambulances.map((a: any) => (
                <tr key={a.id} style={{ borderTop: "1px solid #e8eef8" }}>
                  <td style={{ padding: "8px 14px", fontSize: 13, color: "#1a3a6b", fontWeight: 600 }}>{a.registration_no}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "#0f2952" }}>{a.ambulance_type}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "#6b87b0" }}>{a.district}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12 }}><span style={{ background: a.status === "AVAILABLE" ? "#f0fdf4" : "#fffbeb", color: a.status === "AVAILABLE" ? "#16a34a" : "#d97706", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{a.status}</span></td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "#9ca3af" }}>{a.device_id || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "users" && (
        <div style={{ padding: 32, textAlign: "center", background: "#ffffff", borderRadius: 8, border: "1px solid #c8d8f0" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
          <p style={{ color: "#6b87b0", fontSize: 14, marginBottom: 16 }}>User management interface is currently in development.</p>
          <DevBanner feature="User Management" description="Create paramedic, dispatcher, hospital staff, and government accounts with role-based access." progress={40} eta="Q2 2026" />
        </div>
      )}
    </div>
  )
}
''')
print("AdminPage done")

# Fix HospitalDashboard
with open("/workspace/apps/web/src/pages/HospitalDashboard/HospitalDashboardPage.tsx", "w") as f:
    f.write('''import { useEffect, useState } from "react"
import { hospitalsApi } from "../../api/index"

function DevBanner({ feature, description, progress, eta }: any) {
  return (
    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ background: "#fef3c7", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#92400e", fontWeight: 700, whiteSpace: "nowrap" }}>IN DEVELOPMENT</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#78350f", marginBottom: 4 }}>{feature}</div>
        <div style={{ fontSize: 12, color: "#92400e" }}>{description}</div>
        <div style={{ marginTop: 6, background: "#fde68a", borderRadius: 4, height: 4, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #f59e0b, #10b981)", borderRadius: 4 }} />
        </div>
        <div style={{ fontSize: 11, color: "#a16207", marginTop: 3 }}>{progress}% complete{eta ? ` · ETA: ${eta}` : ""}</div>
      </div>
    </div>
  )
}

export function HospitalDashboardPage() {
  const [hospitals, setHospitals] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    hospitalsApi.getAll().then(r => {
      const list = Array.isArray(r.data) ? r.data : []
      setHospitals(list)
      if (list.length > 0) setSelected(list[0])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const mockIncoming = [
    { id: 1, incident: "TRK-20240312-001", triage_color: "RED", eta_minutes: 8, gcs: 8, spo2: 88, bp: "90/60", ambulance: "KL-05-AA-1234" },
    { id: 2, incident: "TRK-20240312-003", triage_color: "YELLOW", eta_minutes: 14, gcs: 13, spo2: 94, bp: "110/70", ambulance: "KL-07-FF-2345" },
  ]

  const triageConfig: Record<string, { bg: string; border: string; color: string }> = {
    RED: { bg: "#fef2f2", border: "#fecaca", color: "#dc2626" },
    YELLOW: { bg: "#fffbeb", border: "#fde68a", color: "#d97706" },
    GREEN: { bg: "#f0fdf4", border: "#bbf7d0", color: "#16a34a" },
  }

  return (
    <div style={{ padding: 24, background: "#f0f4ff", minHeight: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f2952" }}>Hospital Emergency Dashboard</h1>
        <p style={{ color: "#6b87b0", fontSize: 13, margin: "4px 0 0" }}>Pre-arrival alerts and resource management</p>
      </div>
      <DevBanner feature="Live Pre-Arrival Alert System" description="Real-time patient triage data transmitted from ambulance to hospital before arrival. Enables trauma team pre-activation." progress={72} eta="Q2 2026" />
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        <div>
          <h3 style={{ fontSize: 13, color: "#6b87b0", margin: "0 0 10px", fontWeight: 600 }}>SELECT HOSPITAL</h3>
          {loading ? <div style={{ color: "#6b87b0" }}>Loading...</div> : hospitals.map(h => (
            <div key={h.id} onClick={() => setSelected(h)}
              style={{ padding: "10px 14px", background: selected?.id === h.id ? "#1a3a6b" : "#ffffff", border: `1px solid ${selected?.id === h.id ? "#1a3a6b" : "#c8d8f0"}`, borderRadius: 8, marginBottom: 8, cursor: "pointer" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: selected?.id === h.id ? "#fff" : "#0f2952" }}>{h.name}</div>
              <div style={{ fontSize: 11, color: selected?.id === h.id ? "#93c5fd" : "#6b87b0", marginTop: 2 }}>{h.district} · {h.trauma_level?.replace("_"," ")}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: selected?.id === h.id ? "#6ee7b7" : "#10b981", fontWeight: 600 }}>ICU: {h.resources?.icu_beds_available || 0}/{h.resources?.icu_beds_total || 0}</span>
                <span style={{ fontSize: 11, color: selected?.id === h.id ? "#93c5fd" : (h.resources?.ot_available ? "#10b981" : "#ef4444"), fontWeight: 600 }}>OT: {h.resources?.ot_available ? "Ready" : "Busy"}</span>
              </div>
            </div>
          ))}
        </div>
        <div>
          {selected && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "ICU Available", value: selected.resources?.icu_beds_available || 0, color: "#10b981" },
                  { label: "Ventilators", value: selected.resources?.ventilators_available || 0, color: "#1a3a6b" },
                  { label: "ED Occupancy", value: `${selected.resources?.ed_capacity_current || 0}/${selected.resources?.ed_capacity_total || 0}`, color: "#f59e0b" },
                  { label: "Blood Bank", value: selected.resources?.blood_bank_available ? "Available" : "Critical", color: selected.resources?.blood_bank_available ? "#10b981" : "#ef4444" },
                ].map(card => (
                  <div key={card.label} style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ fontSize: 11, color: "#6b87b0", marginBottom: 4, fontWeight: 500 }}>{card.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</div>
                  </div>
                ))}
              </div>
              <h3 style={{ fontSize: 13, color: "#6b87b0", margin: "0 0 12px", fontWeight: 600 }}>INCOMING PATIENTS — PRE-ARRIVAL ALERTS</h3>
              {mockIncoming.map(p => {
                const tc = triageConfig[p.triage_color] || { bg: "#f1f5f9", border: "#e2e8f0", color: "#475569" }
                return (
                  <div key={p.id} style={{ background: "#ffffff", border: `1px solid ${tc.border}`, borderRadius: 8, padding: 16, marginBottom: 12, display: "flex", gap: 16, alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: tc.bg, border: `2px solid ${tc.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: tc.color, fontWeight: 700, flexShrink: 0 }}>
                      {p.triage_color}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f2952" }}>{p.incident}</div>
                      <div style={{ fontSize: 12, color: "#6b87b0", marginTop: 2 }}>Ambulance: {p.ambulance}</div>
                      <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
                        <span>GCS: <strong style={{ color: "#0f2952" }}>{p.gcs}</strong></span>
                        <span>SpO2: <strong style={{ color: "#0f2952" }}>{p.spo2}%</strong></span>
                        <span>BP: <strong style={{ color: "#0f2952" }}>{p.bp}</strong></span>
                      </div>
                    </div>
                    <div style={{ textAlign: "center", minWidth: 60 }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b" }}>{p.eta_minutes}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>min ETA</div>
                    </div>
                    <button style={{ padding: "8px 14px", background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Acknowledge</button>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
''')
print("HospitalDashboardPage done")

# Fix PublicReportPage
with open("/workspace/apps/web/src/pages/PublicReport/PublicReportPage.tsx", "w") as f:
    f.write('''import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { publicApi } from "../../api/index"
import toast from "react-hot-toast"

export function PublicReportPage() {
  const navigate = useNavigate()
  const [lat, setLat] = useState("")
  const [lon, setLon] = useState("")
  const [desc, setDesc] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState("")

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(String(pos.coords.latitude)); setLon(String(pos.coords.longitude)) },
      () => toast.error("Could not get location")
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await publicApi.report({ latitude: parseFloat(lat), longitude: parseFloat(lon), description: desc })
      setSubmitted(res.data.incident_number)
      toast.success("Report submitted. Help is on the way!")
    } catch { toast.error("Failed to submit report") }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f2952 0%, #1a3a6b 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 480, background: "#ffffff", borderRadius: 12, padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🆘</div>
          <h1 style={{ color: "#ef4444", fontSize: 22, margin: 0, fontWeight: 700 }}>Report an Accident</h1>
          <p style={{ color: "#6b87b0", fontSize: 13, marginTop: 4 }}>Government of Kerala Emergency Reporting</p>
        </div>
        {submitted ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ color: "#10b981", marginBottom: 8 }}>Report Submitted</h2>
            <p style={{ color: "#6b87b0", marginBottom: 4 }}>Incident Number:</p>
            <p style={{ fontWeight: 700, fontSize: 18, color: "#0f2952", marginBottom: 16 }}>{submitted}</p>
            <p style={{ color: "#6b87b0", fontSize: 13, marginBottom: 20 }}>Emergency services have been notified. Help is on the way.</p>
            <button onClick={() => navigate("/")} style={{ padding: "10px 20px", background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Back to Home</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <button type="button" onClick={getLocation} style={{ width: "100%", padding: 10, background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, marginBottom: 16, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              📍 Use My Current Location
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ color: "#2d5086", fontSize: 12, display: "block", marginBottom: 4, fontWeight: 500 }}>Latitude</label>
                <input value={lat} onChange={e => setLat(e.target.value)} placeholder="8.5241" required style={{ width: "100%", padding: "8px 10px", background: "#f8faff", border: "1px solid #c8d8f0", borderRadius: 6, color: "#0f2952", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ color: "#2d5086", fontSize: 12, display: "block", marginBottom: 4, fontWeight: 500 }}>Longitude</label>
                <input value={lon} onChange={e => setLon(e.target.value)} placeholder="76.9366" required style={{ width: "100%", padding: "8px 10px", background: "#f8faff", border: "1px solid #c8d8f0", borderRadius: 6, color: "#0f2952", fontSize: 13, boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: "#2d5086", fontSize: 12, display: "block", marginBottom: 4, fontWeight: 500 }}>Description</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Describe the accident..." style={{ width: "100%", padding: "8px 10px", background: "#f8faff", border: "1px solid #c8d8f0", borderRadius: 6, color: "#0f2952", fontSize: 13, boxSizing: "border-box", resize: "vertical" }} />
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", padding: 12, background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Submitting..." : "🚨 Report Emergency"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
''')
print("PublicReportPage done")
print("\n✅ All pages updated to white/blue theme!")