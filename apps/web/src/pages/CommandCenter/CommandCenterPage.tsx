import { useEffect, useState } from "react"
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
