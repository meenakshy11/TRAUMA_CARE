import { useEffect, useState } from "react"
import { LiveMap }            from "./components/LiveMap"
import { IncidentPanel }      from "./components/IncidentPanel"
import { AmbulancePanel }     from "./components/AmbulancePanel"
import { HospitalPanel }      from "./components/HospitalPanel"
import { HospitalFilterBar }  from "./components/HospitalFilterBar"
import { AlertBanner }        from "./components/AlertBanner"
import { MapLayerControl }    from "./components/MapLayerControl"
import { hospitalsApi, analyticsApi, notificationsApi } from "../../api/index"
import { useHospitalStore }   from "../../store/hospitalStore"
import { useNotificationStore } from "../../store/notificationStore"
// Live-data hooks
import { useLiveIncidents }   from "../../hooks/useLiveIncidents"
import { useLiveAmbulances }  from "../../hooks/useLiveAmbulances"
import { useWebSocket }       from "../../hooks/useWebSocket"

export function CommandCenterPage() {
  // ── Real-time connections (critical — must be first) ─────────────────────
  useWebSocket()           // opens /ws/command and dispatches all server events into stores
  useLiveIncidents(30_000) // initial fetch + 30s polling → incidentStore
  useLiveAmbulances(60_000) // initial fetch + 60s polling → ambulanceStore

  // ── Store actions ────────────────────────────────────────────────────────
  const setHospitals    = useHospitalStore((s) => s.setHospitals)
  const setNotifications = useNotificationStore((s) => s.setAll)

  // ── Local state ──────────────────────────────────────────────────────────
  const [kpi, setKpi]   = useState<any>(null)
  const [tab, setTab]   = useState<"incidents" | "ambulances" | "hospitals">("incidents")

  // ── Initial + periodic data loads ────────────────────────────────────────
  useEffect(() => {
    // Hospitals (less volatile — refresh every 2 minutes)
    const fetchHospitals = () =>
      hospitalsApi
        .getAll()
        .then((r) => { if (Array.isArray(r.data)) setHospitals(r.data) })
        .catch(() => { /* backend unreachable — retain cached data */ })

    // KPI ribbon (refresh every 60 seconds)
    const fetchKPI = () =>
      analyticsApi
        .getKPI()
        .then((r) => { if (r.data) setKpi(r.data) })
        .catch(() => { /* keep previous KPI values */ })

    // Notifications (seed on mount only — WS keeps them current)
    const fetchNotifications = () =>
      notificationsApi
        .getAll()
        .then((r) => { if (Array.isArray(r.data)) setNotifications(r.data) })
        .catch(() => {})

    // Fire immediately
    fetchHospitals()
    fetchKPI()
    fetchNotifications()

    // Schedule polling
    const hospitalTimer = setInterval(fetchHospitals, 120_000)
    const kpiTimer      = setInterval(fetchKPI,      60_000)

    return () => {
      clearInterval(hospitalTimer)
      clearInterval(kpiTimer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── KPI ribbon data ────────────────────────────────────────────────────
  const kpiCards = kpi
    ? [
        { label: "Active Incidents",  value: kpi.active_incidents         ?? 0,       color: "var(--color-danger)" },
        { label: "Ambulances Avail",  value: kpi.ambulances_available      ?? 0,       color: "var(--color-success)" },
        { label: "Golden Hour %",     value: `${kpi.golden_hour_compliance_pct ?? 0}%`, color: "var(--color-warning)" },
        { label: "Hospitals",         value: kpi.hospital_count            ?? 0,       color: "var(--color-accent-blue)" },
        { label: "Today Incidents",   value: kpi.total_incidents_today     ?? 0,       color: "var(--color-accent-cyan)" },
      ]
    : []

  const panelAccentColor =
    tab === "incidents"  ? "var(--color-warning)" :
    tab === "ambulances" ? "var(--color-accent-blue)" :
    "var(--color-success)"

  return (
    /* Full-height column flex — fills the entire <main> area */
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Alert Strip — driven by live notificationStore */}
      <AlertBanner />

      {/* KPI Ribbon */}
      {kpiCards.length > 0 && (
        <div style={{
          display: "flex",
          padding: "0 16px",
          background: "var(--color-bg-secondary)",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
          overflowX: "auto",
        }}>
          {kpiCards.map((k) => (
            <div key={k.label} style={{
              minWidth: 130, padding: "10px 16px",
              borderRight: "1px solid var(--color-border)", flexShrink: 0,
            }}>
              <div style={{ fontSize: 10, color: "var(--color-text-secondary)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                {k.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontFamily: "var(--font-mono)", lineHeight: 1.2, marginTop: 2 }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Map + Side Panel Row — flex:1 fills all remaining height */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* Map fills everything */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <LiveMap />
          {/* Layer control floating over map */}
          <div style={{ position: "absolute", top: 16, left: 16, zIndex: 1000 }}>
            <MapLayerControl />
          </div>
        </div>

        {/* Right glass panel */}
        <div style={{
          width: 340,
          display: "flex",
          flexDirection: "column",
          background: "var(--color-glass-panel)",
          backdropFilter: "blur(12px)",
          borderLeft: `3px solid ${panelAccentColor}`,
          boxShadow: "var(--shadow-elevated)",
          zIndex: 500,
          overflow: "hidden",
          animation: "slide-in-right 300ms ease",
        }}>

          {/* Panel Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
            {(["incidents", "ambulances", "hospitals"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: "12px 4px",
                fontSize: 11, fontWeight: tab === t ? 700 : 500,
                color: tab === t ? "var(--color-accent-blue)" : "var(--color-text-secondary)",
                background: "transparent", border: "none",
                borderBottom: tab === t ? `2px solid var(--color-accent-blue)` : "2px solid transparent",
                cursor: "pointer",
                textTransform: "capitalize",
                letterSpacing: "0.3px",
                transition: "all var(--transition-fast)",
              }}>
                {t}
              </button>
            ))}
          </div>

          {/* Hospital filter bar — only when hospitals tab is active */}
          {tab === "hospitals" && <HospitalFilterBar />}

          {/* Panel Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {tab === "incidents"  && <IncidentPanel />}
            {tab === "ambulances" && <AmbulancePanel />}
            {tab === "hospitals"  && <HospitalPanel />}
          </div>
        </div>
      </div>
    </div>
  )
}
