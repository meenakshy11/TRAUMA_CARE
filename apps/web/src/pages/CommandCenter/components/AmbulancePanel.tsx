import { useAmbulanceStore } from "../../../store/ambulanceStore"

export function AmbulancePanel() {
  const positions = useAmbulanceStore((s) => s.positions)
  const list = Object.entries(positions)

  if (list.length === 0) {
    return (
      <div style={{ color: "var(--color-text-muted)", fontSize: "13px", textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>🚑</div>
        No ambulances broadcasting position
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {list.map(([id, pos]) => {
        const statusColor =
          pos.status === "AVAILABLE" ? "var(--color-success)" :
          pos.status === "DISPATCHED" || pos.status === "EN_ROUTE" ? "var(--color-warning)" :
          pos.status === "ON_SCENE" || pos.status === "TRANSPORTING" ? "var(--color-danger)" :
          "var(--color-text-muted)"

        const badgeClass =
          pos.status === "AVAILABLE" ? "badge-success" :
          pos.status === "DISPATCHED" || pos.status === "EN_ROUTE" ? "badge-warning" :
          pos.status === "ON_SCENE" || pos.status === "TRANSPORTING" ? "badge-danger" :
          "badge-muted"

        return (
          <div key={id} className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 2 }}>
                  {id}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                  GPS Active · {new Date(pos.updatedAt).toLocaleTimeString("en-IN", { hour12: false })}
                </div>
              </div>
              <span className={`badge ${badgeClass}`} style={{ flexShrink: 0 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, display: "inline-block", marginRight: 4 }} />
                {pos.status?.replace(/_/g, " ")}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1, background: "var(--color-bg-tertiary)", borderRadius: "var(--radius-sm)", padding: "5px 8px" }}>
                <div style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>LAT</div>
                <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{pos.lat.toFixed(4)}</div>
              </div>
              <div style={{ flex: 1, background: "var(--color-bg-tertiary)", borderRadius: "var(--radius-sm)", padding: "5px 8px" }}>
                <div style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>LON</div>
                <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{pos.lon.toFixed(4)}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
