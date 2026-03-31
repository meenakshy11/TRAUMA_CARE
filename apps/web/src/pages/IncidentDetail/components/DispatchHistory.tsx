export function DispatchHistory({ dispatch }: { dispatch?: any }) {
  if (!dispatch) return <div style={{ color: "#64748b", fontSize: 13 }}>No dispatch record</div>
  return (
    <div style={{ fontSize: 13, color: "#f1f5f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1f2937" }}>
        <span style={{ color: "#64748b" }}>Dispatched at</span>
        <span>{dispatch.dispatched_at ? new Date(dispatch.dispatched_at).toLocaleTimeString() : "—"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1f2937" }}>
        <span style={{ color: "#64748b" }}>Scene arrived</span>
        <span>{dispatch.scene_arrived_at ? new Date(dispatch.scene_arrived_at).toLocaleTimeString() : "—"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1f2937" }}>
        <span style={{ color: "#64748b" }}>Transport started</span>
        <span>{dispatch.transport_started_at ? new Date(dispatch.transport_started_at).toLocaleTimeString() : "—"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
        <span style={{ color: "#64748b" }}>Response time</span>
        <span style={{ color: "#10b981" }}>{dispatch.response_time_sec ? `${Math.round(dispatch.response_time_sec / 60)} min` : "—"}</span>
      </div>
    </div>
  )
}
