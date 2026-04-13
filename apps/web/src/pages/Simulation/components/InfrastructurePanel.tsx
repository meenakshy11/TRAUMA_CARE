import { useState } from "react"
import styles from "../SimulationPage.module.css"
import { simulationApi } from "../../../api/index"

interface InfraResult {
  new_base_lat: number
  new_base_lon: number
  total_blackspots: number
  avg_dispatch_time_before: number
  avg_dispatch_time_after: number
  time_reduction_minutes: number
  blackspots_improved: number
  coverage_before_pct: number
  coverage_after_pct: number
  coverage_gain_pct: number
}

export function InfrastructurePanel() {
  const [lat, setLat] = useState("")
  const [lon, setLon] = useState("")
  const [district, setDistrict] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InfraResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTest = async () => {
    if (!lat || !lon) return
    setLoading(true)
    setError(null)
    try {
      const res = await simulationApi.infrastructure({
        new_base_lat: parseFloat(lat),
        new_base_lon: parseFloat(lon),
        district: district || undefined,
      })
      setResult(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Simulation failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const KERALA_DISTRICTS = [
    "Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam",
    "Idukki","Ernakulam","Thrissur","Palakkad","Malappuram","Kozhikode",
    "Wayanad","Kannur","Kasaragod",
  ]

  return (
    <div>
      {/* Intro */}
      <div style={{
        background: "rgba(59,130,246,0.08)",
        border: "1px solid rgba(59,130,246,0.2)",
        borderRadius: 8,
        padding: "12px 14px",
        marginBottom: 16,
        fontSize: 12,
        color: "var(--color-text-secondary)",
        lineHeight: 1.6,
      }}>
        🏗️ <strong style={{ color: "var(--color-text-primary)" }}>Infrastructure Optimizer</strong><br />
        Test how adding a new ambulance base at any location affects average response times and golden-hour coverage across all black spots.
      </div>

      {/* Form */}
      <div className={styles.infraForm}>
        <p className={styles.sectionLabel} style={{ marginBottom: 12 }}>New Ambulance Base Location</p>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>Latitude</label>
            <input
              type="number"
              placeholder="e.g. 9.9312"
              value={lat}
              onChange={e => setLat(e.target.value)}
            />
          </div>
          <div className={styles.formField}>
            <label>Longitude</label>
            <input
              type="number"
              placeholder="e.g. 76.2673"
              value={lon}
              onChange={e => setLon(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.formField} style={{ marginBottom: 14 }}>
          <label>Filter District (optional)</label>
          <select
            value={district}
            onChange={e => setDistrict(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-secondary)",
              color: "var(--color-text-primary)",
              fontSize: 13,
              boxSizing: "border-box",
            }}
          >
            <option value="">All Districts</option>
            {KERALA_DISTRICTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Quick presets */}
        <p className={styles.sectionLabel} style={{ marginBottom: 8 }}>Quick Presets</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {[
            { name: "Wayanad", lat: "11.6854", lon: "76.1320" },
            { name: "Idukki", lat: "9.8551", lon: "76.9720" },
            { name: "Kasaragod", lat: "12.4996", lon: "74.9981" },
          ].map(p => (
            <button
              key={p.name}
              onClick={() => { setLat(p.lat); setLon(p.lon) }}
              style={{
                padding: "4px 10px",
                borderRadius: 5,
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-secondary)",
                color: "var(--color-text-secondary)",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              📍 {p.name}
            </button>
          ))}
        </div>

        <button
          className={styles.btnPrimary}
          disabled={!lat || !lon || loading}
          onClick={handleTest}
        >
          {loading ? (
            <><div className={styles.spinner} />Testing Scenario…</>
          ) : (
            <>🏗️ Test Scenario</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 12,
          color: "#ef4444",
          marginBottom: 12,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className={styles.infraResult}>
          <p className={styles.sectionLabel} style={{ marginBottom: 12 }}>Scenario Impact Analysis</p>

          <div className={styles.infraMetricRow}>
            <span className={styles.infraMetricLabel}>Blackspots Analysed</span>
            <span className={styles.infraMetricValue}>{result.total_blackspots}</span>
          </div>
          <div className={styles.infraMetricRow}>
            <span className={styles.infraMetricLabel}>Avg Dispatch Time (Before)</span>
            <span className={styles.infraMetricValue}>{result.avg_dispatch_time_before} min</span>
          </div>
          <div className={styles.infraMetricRow}>
            <span className={styles.infraMetricLabel}>Avg Dispatch Time (After)</span>
            <span className={`${styles.infraMetricValue} ${styles.improvement}`}>{result.avg_dispatch_time_after} min</span>
          </div>
          <div className={styles.infraMetricRow}>
            <span className={styles.infraMetricLabel}>Time Reduction</span>
            <span className={`${styles.infraMetricValue} ${styles.improvement}`}>
              ▼ {result.time_reduction_minutes} min
            </span>
          </div>
          <div className={styles.infraMetricRow}>
            <span className={styles.infraMetricLabel}>Blackspots Improved</span>
            <span className={`${styles.infraMetricValue} ${styles.gain}`}>{result.blackspots_improved}</span>
          </div>
          <div className={styles.infraMetricRow}>
            <span className={styles.infraMetricLabel}>Coverage Before</span>
            <span className={styles.infraMetricValue}>{result.coverage_before_pct}%</span>
          </div>
          <div className={styles.infraMetricRow}>
            <span className={styles.infraMetricLabel}>Coverage After</span>
            <span className={`${styles.infraMetricValue} ${styles.improvement}`}>{result.coverage_after_pct}%</span>
          </div>
          <div className={styles.infraMetricRow}>
            <span className={styles.infraMetricLabel}>Coverage Gain</span>
            <span className={`${styles.infraMetricValue} ${styles.gain}`}>+{result.coverage_gain_pct}%</span>
          </div>

          {/* Visual bar */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-text-muted)", marginBottom: 4 }}>
              <span>Coverage Before</span><span>Coverage After</span>
            </div>
            <div style={{ height: 8, background: "var(--color-bg-tertiary)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${result.coverage_before_pct}%`, background: "#f59e0b", borderRadius: 4 }} />
            </div>
            <div style={{ height: 8, background: "var(--color-bg-tertiary)", borderRadius: 4, overflow: "hidden", marginTop: 4 }}>
              <div style={{ height: "100%", width: `${result.coverage_after_pct}%`, background: "#10b981", borderRadius: 4, transition: "width 0.6s ease" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
