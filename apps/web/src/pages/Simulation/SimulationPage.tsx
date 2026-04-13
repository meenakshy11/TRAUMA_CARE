import { useState, useCallback, useEffect } from "react"
import styles from "./SimulationPage.module.css"
import { simulationApi, ambulancesApi, hospitalsApi, blackspotsApi } from "../../api/index"
import { SimulationMap } from "./components/SimulationMap"
import { ScenarioForm } from "./components/ScenarioForm"
import { SimulationResultPanel } from "./components/CoverageResultOverlay"
import { CoverageHeatmapPanel } from "./components/CoverageHeatmapPanel"
import { InfrastructurePanel } from "./components/InfrastructurePanel"

type RightTab = "result" | "coverage" | "infrastructure"

const RIGHT_TABS: { key: RightTab; label: string; icon: string }[] = [
  { key: "result",         label: "Simulation",     icon: "⚡" },
  { key: "coverage",       label: "Coverage",        icon: "🔵" },
  { key: "infrastructure", label: "Infrastructure",  icon: "🏗️" },
]

export function SimulationPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [severity,          setSeverity]          = useState("SEVERE")
  const [clickedLatLng,     setClickedLatLng]     = useState<{ lat: number; lng: number } | null>(null)
  const [simResult,         setSimResult]          = useState<any>(null)
  const [loading,           setLoading]            = useState(false)
  const [routeLoading,      setRouteLoading]       = useState(false)
  const [rightTab,          setRightTab]           = useState<RightTab>("result")
  const [showCoverageZones, setShowCoverageZones]  = useState(false)

  // Map data
  const [ambulances,  setAmbulances]  = useState<any[]>([])
  const [hospitals,   setHospitals]   = useState<any[]>([])
  const [blackspots,  setBlackspots]  = useState<any[]>([])
  const [coverageZones, setCoverageZones] = useState<any[]>([])
  const [coverageLoading, setCoverageLoading] = useState(false)

  // ── Load map data on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [ambRes, hospRes, bsRes] = await Promise.allSettled([
          ambulancesApi.getAll(),
          hospitalsApi.getAll(),
          blackspotsApi.getAll(),
        ])

        if (ambRes.status === "fulfilled")  setAmbulances(ambRes.value.data  ?? [])
        if (hospRes.status === "fulfilled") setHospitals(hospRes.value.data  ?? [])
        if (bsRes.status === "fulfilled")   setBlackspots(bsRes.value.data   ?? [])
      } catch (_) {
        // silently fail — map still works; simulation runs from API
      }
    }
    load()
  }, [])

  // ── Load coverage zones (ambulance positions + status) ──────────────────
  // Always load on mount so ambulance markers show immediately.
  // Reload when coverage tab is opened or toggle switched.
  useEffect(() => {
    const load = async () => {
      setCoverageLoading(true)
      try {
        const res = await simulationApi.coverage()
        setCoverageZones(res.data?.coverage_zones ?? [])
      } catch (_) {
        // If coverage fails, fall back to ambulancesApi data
        setCoverageZones([])
      } finally {
        setCoverageLoading(false)
      }
    }
    load()
  }, [rightTab]) // reload when switching to coverage tab

  // ── Map click handler ──────────────────────────────────────────────────────
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedLatLng({ lat, lng })
    setSimResult(null)
  }, [])

  // ── Run simulation ─────────────────────────────────────────────────────────
  const handleSimulate = async () => {
    if (!clickedLatLng) return
    setLoading(true)
    setRouteLoading(false)
    setRightTab("result")
    try {
      const res = await simulationApi.accident(clickedLatLng.lat, clickedLatLng.lng, severity)
      setSimResult(res.data)
      // Start route-loading indicator — OSRM fetch happens inside SimulationMap
      // and takes up to 6s. We show the badge for that window then clear it.
      setRouteLoading(true)
      setTimeout(() => setRouteLoading(false), 7000)
    } catch (e: any) {
      setSimResult({ error: e?.response?.data?.detail || "Simulation failed." })
      setRouteLoading(false)
    } finally {
      setLoading(false)
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setClickedLatLng(null)
    setSimResult(null)
    setRouteLoading(false)
  }

  // ── Ambulances to show on map: merge coverage zone data if available ───────
  const mapAmbulances = coverageZones.length
    ? coverageZones.map((z: any) => ({
        id:            z.ambulance_id,
        registration_no: z.registration_no,
        current_lat:   z.lat,
        current_lon:   z.lng,
        status:        z.status,
        district:      z.district,
      }))
    : ambulances.filter((a: any) => a.current_lat && a.current_lon)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>⚡ Simulation Engine</h1>
          <p>Click on the map to simulate an accident — nearest ambulance &amp; hospital are calculated instantly.</p>
        </div>

        <div className={styles.modeTabs}>
          {RIGHT_TABS.map(t => (
            <button
              key={t.key}
              className={`${styles.modeTab} ${rightTab === t.key ? styles.active : ""}`}
              onClick={() => setRightTab(t.key)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Three-panel layout */}
      <div className={styles.layout}>

        {/* ── LEFT — Controls ─────────────────────────────────────────────── */}
        <div className={styles.leftPanel}>
          <ScenarioForm
            severity={severity}
            onSeverityChange={setSeverity}
            clickedLatLng={clickedLatLng}
            showCoverageZones={showCoverageZones}
            onToggleCoverage={() => setShowCoverageZones(v => !v)}
            onSimulate={handleSimulate}
            onReset={handleReset}
            loading={loading}
          />
        </div>

        {/* ── CENTER — Map ─────────────────────────────────────────────────── */}
        <div className={styles.mapWrapper}>
          <SimulationMap
            onMapClick={handleMapClick}
            simResult={simResult && !simResult.error ? simResult : null}
            ambulances={mapAmbulances}
            hospitals={hospitals}
            blackspots={blackspots}
            showCoverageZones={showCoverageZones}
            clickedLatLng={clickedLatLng}
          />

          {/* Map overlay badges */}
          <div className={styles.mapOverlay}>
            {!clickedLatLng && (
              <span className={`${styles.mapBadge} ${styles.clickMode}`}>
                👆 Click map to place accident
              </span>
            )}
            {loading && (
              <span className={`${styles.mapBadge} ${styles.simulating}`}>
                ⚡ Simulating…
              </span>
            )}
            {!loading && routeLoading && simResult && !simResult.error && (
              <span className={`${styles.mapBadge} ${styles.simulating}`}>
                🗺️ Fetching road route…
              </span>
            )}
          </div>

          {/* Map legend overlay */}
          {(showCoverageZones || (simResult && !simResult.error)) && (
            <div className={styles.coverageLegend}>
              {simResult && !simResult.error && (
                <>
                  <h4>Route Legend</h4>
                  <div className={styles.legendItem}>
                    <div style={{ width: 20, height: 3, background: "#3b82f6", borderRadius: 2, flexShrink: 0 }} />
                    Dispatch (ambulance → scene)
                  </div>
                  <div className={styles.legendItem} style={{ marginBottom: showCoverageZones ? 10 : 0 }}>
                    <div style={{ width: 20, height: 3, background: "#8b5cf6", borderRadius: 2, flexShrink: 0, borderBottom: "none", backgroundImage: "repeating-linear-gradient(90deg,#8b5cf6 0,#8b5cf6 6px,transparent 6px,transparent 10px)" }} />
                    Transport (scene → hospital)
                  </div>
                </>
              )}
              {showCoverageZones && (
                <>
                  <h4 style={{ marginTop: simResult && !simResult.error ? 4 : 0 }}>Coverage Zones</h4>
                  <div className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ color: "#10b981" }} />15 min (10 km)
                  </div>
                  <div className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ color: "#f59e0b" }} />30 min (20 km)
                  </div>
                  <div className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ color: "#f97316" }} />45 min (30 km)
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT — Panels ───────────────────────────────────────────────── */}
        <div className={styles.rightPanel}>
          <div className={styles.rightTabs}>
            {RIGHT_TABS.map(t => (
              <button
                key={t.key}
                className={`${styles.rightTab} ${rightTab === t.key ? styles.active : ""}`}
                onClick={() => setRightTab(t.key)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className={styles.rightContent}>
            {rightTab === "result" && (
              simResult?.error ? (
                <div style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 8, padding: "14px 16px",
                  fontSize: 13, color: "#ef4444",
                }}>
                  ⚠️ {simResult.error}
                </div>
              ) : (
                <SimulationResultPanel result={simResult} />
              )
            )}

            {rightTab === "coverage" && (
              <CoverageHeatmapPanel
                zones={coverageZones}
                loading={coverageLoading}
              />
            )}

            {rightTab === "infrastructure" && (
              <InfrastructurePanel />
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
