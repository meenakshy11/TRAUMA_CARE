import styles from "../SimulationPage.module.css"

interface ScenarioFormProps {
  severity: string
  onSeverityChange: (s: string) => void
  clickedLatLng: { lat: number; lng: number } | null
  showCoverageZones: boolean
  onToggleCoverage: () => void
  onSimulate: () => void
  onReset: () => void
  loading: boolean
}

const SEVERITIES = [
  { key: "CRITICAL", label: "Critical", emoji: "🔴", class: "critical" },
  { key: "SEVERE",   label: "Severe",   emoji: "🟡", class: "severe"   },
  { key: "MODERATE", label: "Moderate", emoji: "🔵", class: "moderate" },
]

export function ScenarioForm({
  severity,
  onSeverityChange,
  clickedLatLng,
  showCoverageZones,
  onToggleCoverage,
  onSimulate,
  onReset,
  loading,
}: ScenarioFormProps) {
  return (
    <>
      {/* Severity selector */}
      <div>
        <p className={styles.sectionLabel}>Injury Severity</p>
        <div className={styles.severityGrid}>
          {SEVERITIES.map((s) => (
            <button
              key={s.key}
              className={`${styles.severityBtn} ${styles[s.class as keyof typeof styles]} ${severity === s.key ? styles.selected : ""}`}
              onClick={() => onSeverityChange(s.key)}
            >
              <div style={{ fontSize: 16, marginBottom: 3 }}>{s.emoji}</div>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scene time info */}
      <div style={{
        background: "var(--color-bg-tertiary)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: "10px 12px",
      }}>
        <p className={styles.sectionLabel} style={{ marginBottom: 6 }}>Scene Time</p>
        {SEVERITIES.map((s) => (
          <div key={s.key} style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 11, marginBottom: 3,
            color: severity === s.key ? "var(--color-text-primary)" : "var(--color-text-muted)",
            fontWeight: severity === s.key ? 700 : 400,
          }}>
            <span>{s.emoji} {s.label}</span>
            <span style={{ fontFamily: "monospace" }}>
              {s.key === "CRITICAL" ? "10" : s.key === "SEVERE" ? "7" : "5"} min
            </span>
          </div>
        ))}
      </div>

      {/* Map click instruction */}
      {!clickedLatLng ? (
        <div className={styles.clickInstruction}>
          <div className={styles.icon}>🗺️</div>
          <p>Click anywhere on the map to simulate an accident at that location.</p>
        </div>
      ) : (
        <div className={styles.coordDisplay}>
          <p className={styles.sectionLabel} style={{ marginBottom: 8 }}>📍 Accident Location</p>
          <div className={styles.coordRow}>
            <span className={styles.coordLabel}>Latitude</span>
            <span className={styles.coordValue}>{clickedLatLng.lat.toFixed(5)}</span>
          </div>
          <div className={styles.coordRow}>
            <span className={styles.coordLabel}>Longitude</span>
            <span className={styles.coordValue}>{clickedLatLng.lng.toFixed(5)}</span>
          </div>
        </div>
      )}

      {/* Coverage toggle */}
      <div className={styles.toggle} onClick={onToggleCoverage}>
        <span className={styles.toggleLabel}>
          <span>🔵</span> Show Coverage Zones
        </span>
        <div className={`${styles.toggleSwitch} ${showCoverageZones ? styles.on : ""}`} />
      </div>

      {/* Legend when coverage is on */}
      {showCoverageZones && (
        <div style={{
          background: "var(--color-bg-tertiary)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          padding: "10px 12px",
        }}>
          <p className={styles.sectionLabel} style={{ marginBottom: 8 }}>Coverage Legend</p>
          {[
            { color: "#10b981", label: "15 min  (10 km)" },
            { color: "#f59e0b", label: "30 min  (20 km)" },
            { color: "#f97316", label: "45 min  (30 km)" },
          ].map((z) => (
            <div key={z.color} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, fontSize: 11, color: "var(--color-text-secondary)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", border: `2px solid ${z.color}`, flexShrink: 0 }} />
              {z.label}
            </div>
          ))}
        </div>
      )}

      {/* Simulate button */}
      <button
        className={styles.btnPrimary}
        disabled={!clickedLatLng || loading}
        onClick={onSimulate}
      >
        {loading ? (
          <><div className={styles.spinner} />Running Simulation…</>
        ) : (
          <>⚡ Simulate Accident</>
        )}
      </button>

      {/* Reset */}
      {clickedLatLng && (
        <button className={styles.btnSecondary} onClick={onReset}>
          ↺ Reset
        </button>
      )}
    </>
  )
}
