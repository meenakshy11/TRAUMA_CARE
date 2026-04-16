import styles from "../SimulationPage.module.css"

const PRIORITY_LEGEND = [
  { key: "1st", color: "#ef4444", label: "Critical" },
  { key: "2nd", color: "#f97316", label: "High" },
  { key: "3rd", color: "#eab308", label: "Moderate" },
  { key: "4th", color: "#84cc16", label: "Low" },
  { key: "5th", color: "#60a5fa", label: "Minimal" },
]

interface ScenarioFormProps {
  severity: string
  onSeverityChange: (s: string) => void
  clickedLatLng: { lat: number; lng: number } | null
  showCoverageZones: boolean
  onToggleCoverage: () => void
  showBlackspotSegments: boolean
  onToggleBlackspots: () => void
  showHospitals: boolean
  onToggleHospitals: () => void
  ambulanceStatusFilter: string[]
  onToggleAmbulanceStatus: (s: string) => void
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
  showBlackspotSegments,
  onToggleBlackspots,
  showHospitals,
  onToggleHospitals,
  ambulanceStatusFilter,
  onToggleAmbulanceStatus,
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

      {/* ── Map Layers section ───────────────────────────────────────────── */}
      <div>
        <p className={styles.sectionLabel}>Map Layers</p>

        {/* Coverage Zones toggle */}
        <div className={styles.toggle} onClick={onToggleCoverage} style={{ marginBottom: 6 }}>
          <span className={styles.toggleLabel}>
            <span>🔵</span> Coverage Zones
          </span>
          <div className={`${styles.toggleSwitch} ${showCoverageZones ? styles.on : ""}`} />
        </div>

        {/* Black Spot Segments toggle */}
        <div className={styles.toggle} onClick={onToggleBlackspots}
          style={{
            borderColor: showBlackspotSegments ? "rgba(239,68,68,0.4)" : undefined,
            background:  showBlackspotSegments ? "rgba(239,68,68,0.05)" : undefined,
          }}
        >
          <span className={styles.toggleLabel}>
            <span>🚨</span> Black Spot Segments
          </span>
          <div className={`${styles.toggleSwitch} ${showBlackspotSegments ? styles.on : ""}`}
            style={{ background: showBlackspotSegments ? "#ef4444" : undefined }}
          />
        </div>

        {/* Hospitals toggle */}
        <div className={styles.toggle} onClick={onToggleHospitals}
          style={{
            borderColor: showHospitals ? "rgba(139,92,246,0.4)" : undefined,
            background:  showHospitals ? "rgba(139,92,246,0.05)" : undefined,
          }}
        >
          <span className={styles.toggleLabel}>
            <span>🏥</span> Hospitals
          </span>
          <div className={`${styles.toggleSwitch} ${showHospitals ? styles.on : ""}`}
            style={{ background: showHospitals ? "#8b5cf6" : undefined }}
          />
        </div>
      </div>

      {/* Coverage zone legend */}
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

      {/* Black spot priority legend */}
      {showBlackspotSegments && (
        <div style={{
          background: "var(--color-bg-tertiary)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 8,
          padding: "10px 12px",
        }}>
          <p className={styles.sectionLabel} style={{ marginBottom: 8 }}>Black Spot Priority</p>
          {PRIORITY_LEGEND.map((p) => (
            <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, fontSize: 11 }}>
              {/* Segment line swatch */}
              <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: p.color }} />
                <div style={{ width: 18, height: 3, background: p.color, borderRadius: 2 }} />
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: p.color }} />
              </div>
              <span style={{ color: p.color, fontWeight: 700 }}>{p.key}</span>
              <span style={{ color: "var(--color-text-muted)" }}>— {p.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Ambulance Filter ────────────────────────────────────────────── */}
      <div>
        <p className={styles.sectionLabel}>Ambulance Status</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {[
            { key: 'ALL',        label: 'All',        color: '#94a3b8' },
            { key: 'AVAILABLE',  label: 'Available',  color: '#10b981' },
            { key: 'DISPATCHED', label: 'Dispatched', color: '#f59e0b' },
            { key: 'BUSY',       label: 'Busy',       color: '#ef4444' },
          ].map(s => {
            const isActive = ambulanceStatusFilter.includes(s.key)
            return (
              <button
                key={s.key}
                onClick={() => onToggleAmbulanceStatus(s.key)}
                style={{
                  padding: '4px 11px',
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1px solid ${isActive ? s.color : 'var(--color-border-strong)'}`,
                  background: isActive ? `${s.color}22` : 'transparent',
                  color: isActive ? s.color : 'var(--color-text-muted)',
                  transition: 'all .15s',
                }}
              >
                🚑 {s.label}
              </button>
            )
          })}
        </div>
      </div>

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
