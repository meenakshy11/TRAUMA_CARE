import type { TimelineEvent } from "../mockDataGenerators"

const STATUS_DOT_COLOR: Record<string, string> = {
  REPORTED:         "#f59e0b",
  DISPATCH_PENDING: "#fb923c",
  DISPATCHED:       "#3b82f6",
  EN_ROUTE:         "#8b5cf6",
  ON_SCENE:         "#06b6d4",
  PATIENT_LOADED:   "#f59e0b",
  TRANSPORTING:     "#10b981",
  HOSPITAL_ARRIVED: "#6ee7b7",
  CLOSED:           "#64748b",
}

const AGENT_ICON: Record<string, string> = {
  "Public Reporter":    "🧑",
  "System Engine":      "⚙️",
  "Dispatcher Command": "🎛",
  "Paramedic Tablet":   "📱",
  "Hospital Dashboard": "🏥",
}

export function IncidentTimeline({ timeline }: { timeline: TimelineEvent[] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div style={{ color: "var(--color-text-muted)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
        No timeline entries yet
      </div>
    )
  }

  return (
    <div style={{ position: "relative", paddingLeft: 24 }}>
      {/* Vertical line */}
      <div style={{
        position: "absolute", left: 9, top: 8, bottom: 8,
        width: 2, background: "var(--color-border)",
      }} />

      {timeline.map((t, i) => {
        const color = STATUS_DOT_COLOR[t.status] || "#64748b"
        const isFirst = i === 0

        return (
          <div key={t.id} style={{ display: "flex", gap: 12, marginBottom: 18, position: "relative" }}>
            {/* Dot */}
            <div style={{
              width: 12, height: 12, borderRadius: "50%",
              background: isFirst ? color : "var(--color-bg-secondary)",
              border: `2px solid ${color}`,
              flexShrink: 0, marginTop: 2, zIndex: 1,
              boxShadow: isFirst ? `0 0 0 4px ${color}22` : "none",
            }} />

            {/* Content */}
            <div style={{
              flex: 1, paddingBottom: 4,
              background: isFirst ? `${color}0d` : "transparent",
              borderRadius: isFirst ? 8 : 0,
              padding: isFirst ? "8px 10px" : "0 0 4px",
              border: isFirst ? `1px solid ${color}30` : "none",
              marginLeft: isFirst ? -2 : 0,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color }}>
                  {t.status.replace(/_/g, " ")}
                </div>
                <div style={{ fontSize: 10, color: "var(--color-text-muted)", fontFamily: "monospace", flexShrink: 0 }}>
                  {new Date(t.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                <span style={{ fontSize: 11 }}>{AGENT_ICON[t.agent] || "📋"}</span>
                <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{t.agent}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
