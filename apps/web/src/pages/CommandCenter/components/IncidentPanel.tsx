import { useIncidentStore } from "../../../store/incidentStore"

const STATUS_COLOR: Record<string, string> = {
  REPORTED: "#f59e0b", DISPATCH_PENDING: "#f97316", DISPATCHED: "#3b82f6",
  EN_ROUTE: "#8b5cf6", ON_SCENE: "#06b6d4", TRANSPORTING: "#10b981",
  HOSPITAL_ARRIVED: "#059669", CLOSED: "#9ca3af",
}

export function IncidentPanel() {
  const incidents = useIncidentStore((s) => s.incidents)
  const list = Object.values(incidents).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div>
      {list.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#6b87b0", fontSize: 13 }}>No active incidents</div>}
      {list.map((inc: any) => (
        <div key={inc.id} style={{ padding: "10px 14px", borderBottom: "1px solid #e8eef8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 12, color: "#1a3a6b", fontWeight: 600 }}>{inc.incident_number}</div>
            <span style={{ fontSize: 10, background: `${STATUS_COLOR[inc.status] || "#9ca3af"}22`, color: STATUS_COLOR[inc.status] || "#9ca3af", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{inc.status?.replace("_"," ")}</span>
          </div>
          <div style={{ fontSize: 11, color: "#2d5086", marginTop: 3 }}>{inc.accident_type?.replace("_"," ")} · {inc.severity}</div>
          <div style={{ fontSize: 11, color: "#6b87b0", marginTop: 2 }}>{inc.district || `${inc.latitude?.toFixed(3)}, ${inc.longitude?.toFixed(3)}`}</div>
          <div style={{ fontSize: 11, color: "#6b87b0", marginTop: 2 }}>👤 {inc.patient_count} patient{inc.patient_count !== 1 ? "s" : ""}</div>
        </div>
      ))}
    </div>
  )
}
