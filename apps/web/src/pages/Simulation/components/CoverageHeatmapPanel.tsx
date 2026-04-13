import styles from "../SimulationPage.module.css"

interface CoverageZone {
  ambulance_id: string
  registration_no: string
  lat: number
  lng: number
  district: string
  status: string
  radius_15min_km: number
  radius_30min_km: number
  radius_45min_km: number
}

interface CoverageHeatmapPanelProps {
  zones: CoverageZone[]
  loading: boolean
}

export function CoverageHeatmapPanel({ zones, loading }: CoverageHeatmapPanelProps) {
  const available = zones.filter(z => z.status === "AVAILABLE").length
  const busy      = zones.length - available

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.spinner} style={{ width: 28, height: 28, borderWidth: 3, borderColor: "rgba(59,130,246,0.3)", borderTopColor: "#3b82f6" }} />
        <p className={styles.emptyText}>Loading coverage data…</p>
      </div>
    )
  }

  if (!zones.length) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🔵</div>
        <p className={styles.emptyText}>
          No ambulance positions available.<br />
          Enable "Show Coverage Zones" toggle to visualise zones on the map.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Legend */}
      <div style={{
        background: "rgba(15,20,30,0.6)",
        border: "1px solid var(--color-border)",
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 14,
      }}>
        <p className={styles.sectionLabel} style={{ marginBottom: 10 }}>Golden Hour Coverage Zones</p>
        {[
          { color: "#10b981", label: "15 min — 10 km radius", desc: "Fastest response" },
          { color: "#f59e0b", label: "30 min — 20 km radius", desc: "Acceptable response" },
          { color: "#f97316", label: "45 min — 30 km radius", desc: "Near limit" },
          { color: "#ef4444", label: "> 45 min", desc: "Risk zone — outside golden hour" },
        ].map(z => (
          <div key={z.color} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", border: `2.5px solid ${z.color}`, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-primary)" }}>{z.label}</div>
              <div style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{z.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className={styles.coverageStats}>
        <div className={styles.coverageStat}>
          <div className={styles.coverageStatDot} style={{ background: "#3b82f6" }} />
          <div className={styles.coverageStatLabel}>Total Units</div>
          <div className={styles.coverageStatValue}>{zones.length}</div>
        </div>
        <div className={styles.coverageStat}>
          <div className={styles.coverageStatDot} style={{ background: "#10b981" }} />
          <div className={styles.coverageStatLabel}>Available</div>
          <div className={styles.coverageStatValue} style={{ color: "#10b981" }}>{available}</div>
        </div>
        <div className={styles.coverageStat}>
          <div className={styles.coverageStatDot} style={{ background: "#f59e0b" }} />
          <div className={styles.coverageStatLabel}>Busy</div>
          <div className={styles.coverageStatValue} style={{ color: "#f59e0b" }}>{busy}</div>
        </div>
      </div>

      {/* Zone list */}
      <p className={styles.sectionLabel} style={{ marginBottom: 8 }}>Active Ambulance Zones</p>
      <div className={styles.coverageZoneList}>
        {zones.map((z) => (
          <div key={z.ambulance_id} className={styles.coverageZoneItem}>
            <div className={styles.czLeft}>
              <div className={styles.czName}>🚑 {z.registration_no}</div>
              <div className={styles.czDistrict}>{z.district}</div>
            </div>
            <span className={`${styles.czStatus} ${z.status === "AVAILABLE" ? styles.available : styles.busy}`}>
              {z.status}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
