import styles from "../SimulationPage.module.css"

interface SimResult {
  nearest_ambulance: string
  ambulance_type: string
  ambulance_distance: number
  dispatch_time: number
  hospital_selected: string
  hospital_district: string
  hospital_trauma_level: string
  hospital_distance: number
  transport_time: number
  scene_time: number
  total_response_time: number
  golden_hour_status: string
  golden_hour_met: boolean
  severity: string
}

interface SimulationResultPanelProps {
  result: SimResult | null
}

export function SimulationResultPanel({ result }: SimulationResultPanelProps) {
  if (!result) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⚡</div>
        <p className={styles.emptyText}>
          Click on the map to place an accident,<br />
          then press <strong>Simulate Accident</strong> to see the full response timeline.
        </p>
      </div>
    )
  }

  const total = result.total_response_time
  const dispatchPct  = (result.dispatch_time  / total) * 100
  const scenePct     = (result.scene_time      / total) * 100
  const transportPct = (result.transport_time  / total) * 100

  return (
    <>
      {/* Golden hour hero */}
      <div className={`${styles.goldenHeroBanner} ${result.golden_hour_met ? styles.withinGH : styles.exceedsGH}`}>
        <div className={styles.ghIcon}>{result.golden_hour_met ? "✅" : "⛔"}</div>
        <div className={styles.ghText}>
          <div className={`${styles.ghStatus} ${result.golden_hour_met ? styles.withinGH : styles.exceedsGH}`}>
            {result.golden_hour_status}
          </div>
          <div className={styles.ghTime}>{total} <span style={{ fontSize: 14 }}>min</span></div>
          <div className={styles.ghTimeLabel}>Total Response Time</div>
        </div>
      </div>

      {/* Response timeline bar */}
      <div className={styles.timelineBar}>
        <p className={styles.sectionLabel} style={{ marginBottom: 8 }}>Response Timeline</p>
        <div className={styles.timelineBarTrack}>
          <div className={`${styles.timelineSegment} ${styles.dispatch}`}  style={{ width: `${dispatchPct}%`  }} />
          <div className={`${styles.timelineSegment} ${styles.scene}`}     style={{ width: `${scenePct}%`     }} />
          <div className={`${styles.timelineSegment} ${styles.transport}`} style={{ width: `${transportPct}%` }} />
        </div>
        <div className={styles.timelineLegend}>
          <div className={styles.tlLegendItem}>
            <div className={styles.tlLegendDot} style={{ background: "#3b82f6" }} />
            Dispatch {result.dispatch_time} min
          </div>
          <div className={styles.tlLegendItem}>
            <div className={styles.tlLegendDot} style={{ background: "#f59e0b" }} />
            Scene {result.scene_time} min
          </div>
          <div className={styles.tlLegendItem}>
            <div className={styles.tlLegendDot} style={{ background: "#8b5cf6" }} />
            Transport {result.transport_time} min
          </div>
        </div>
      </div>

      {/* Result cards */}
      <div className={styles.resultGrid}>

        {/* Nearest Ambulance */}
        <div className={`${styles.resultCard} ${styles.resultCardWide}`}>
          <div className={styles.resultCardLabel}>🚑 Nearest Ambulance</div>
          <div className={`${styles.resultCardValue} ${styles.ambulance}`}>{result.nearest_ambulance}</div>
          <div className={styles.resultCardSub}>{result.ambulance_type} unit</div>
        </div>

        {/* Ambulance Distance */}
        <div className={styles.resultCard}>
          <div className={styles.resultCardLabel}>Distance to Scene</div>
          <div className={`${styles.resultCardValue} ${styles.time}`}>{result.ambulance_distance} km</div>
        </div>

        {/* Dispatch Time */}
        <div className={styles.resultCard}>
          <div className={styles.resultCardLabel}>Dispatch Time</div>
          <div className={`${styles.resultCardValue} ${styles.time}`}>{result.dispatch_time} min</div>
        </div>

        {/* Hospital */}
        <div className={`${styles.resultCard} ${styles.resultCardWide}`}>
          <div className={styles.resultCardLabel}>🏥 Hospital Selected</div>
          <div className={`${styles.resultCardValue} ${styles.hospital}`}>{result.hospital_selected}</div>
          <div className={styles.resultCardSub}>
            {result.hospital_district} · {result.hospital_trauma_level?.replace("_", " ")}
          </div>
        </div>

        {/* Hospital Distance */}
        <div className={styles.resultCard}>
          <div className={styles.resultCardLabel}>Hospital Distance</div>
          <div className={`${styles.resultCardValue} ${styles.time}`}>{result.hospital_distance} km</div>
        </div>

        {/* Transport Time */}
        <div className={styles.resultCard}>
          <div className={styles.resultCardLabel}>Transport Time</div>
          <div className={`${styles.resultCardValue} ${styles.time}`}>{result.transport_time} min</div>
        </div>

        {/* Scene Time */}
        <div className={styles.resultCard}>
          <div className={styles.resultCardLabel}>Scene Time</div>
          <div className={`${styles.resultCardValue} ${styles.time}`}>{result.scene_time} min</div>
          <div className={styles.resultCardSub}>
            {result.severity === "CRITICAL" ? "Critical stabilisation" : result.severity === "SEVERE" ? "Severe care" : "Moderate care"}
          </div>
        </div>

        {/* Severity */}
        <div className={styles.resultCard}>
          <div className={styles.resultCardLabel}>Severity</div>
          <div className={styles.resultCardValue} style={{
            color: result.severity === "CRITICAL" ? "#ef4444" : result.severity === "SEVERE" ? "#f59e0b" : "#3b82f6"
          }}>
            {result.severity === "CRITICAL" ? "🔴" : result.severity === "SEVERE" ? "🟡" : "🔵"} {result.severity}
          </div>
        </div>

      </div>
    </>
  )
}
