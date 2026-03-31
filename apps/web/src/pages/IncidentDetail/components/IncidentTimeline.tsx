const STATUS_COLOR: Record<string, string> = {
  REPORTED: "#f59e0b", DISPATCHED: "#3b82f6", EN_ROUTE: "#8b5cf6",
  ON_SCENE: "#06b6d4", TRANSPORTING: "#10b981", HOSPITAL_ARRIVED: "#6ee7b7", CLOSED: "#64748b",
}

export function IncidentTimeline({ timeline }: { timeline: any[] }) {
  if (!timeline || timeline.length === 0) return <div style={{ color: "#64748b", fontSize: 13 }}>No timeline entries</div>
  return (
    <div>
      {timeline.map((t: any) => (
        <div key={t.id} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLOR[t.status] || "#64748b", flexShrink: 0 }} />
            <div style={{ width: 1, flex: 1, background: "#1f2937", margin: "2px 0" }} />
          </div>
          <div style={{ paddingBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: STATUS_COLOR[t.status] || "#f1f5f9" }}>{t.status?.replace(/_/g, " ")}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{t.note}</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{t.created_at ? new Date(t.created_at).toLocaleString() : ""}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
