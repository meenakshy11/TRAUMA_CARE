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
    { label: "Hospitals", value: kpi.hospital_count ?? 0, color: "#3b82f6" },
    { label: "Today Incidents", value: kpi.total_incidents_today ?? 0, color: "#06b6d4" },
  ] : []

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", color: "#f1f5f9" }}>
      <AlertBanner />
      <div style={{ display: "flex", gap: 0, padding: "8px 16px", overflowX: "auto", background: "#060d1a", borderBottom: "1px solid #1f2937" }}>
        {kpiCards.map(k => (
          <div key={k.label} style={{ minWidth: 130, padding: "6px 14px", borderRight: "1px solid #1f2937" }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <MapLayerControl />
          <LiveMap />
        </div>
        <div style={{ width: 320, background: "#060d1a", borderLeft: "1px solid #1f2937", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #1f2937" }}>
            {(["incidents","ambulances","hospitals"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: "8px 4px", fontSize: 11, background: tab === t ? "#10b98120" : "none", color: tab === t ? "#10b981" : "#64748b", border: "none", borderBottom: tab === t ? "2px solid #10b981" : "2px solid transparent", cursor: "pointer", textTransform: "capitalize" }}>
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
