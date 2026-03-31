import { useEffect, useState } from "react"
import { ambulancesApi } from "../../../api/index"

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: "#10b981", DISPATCHED: "#3b82f6", ON_SCENE: "#06b6d4",
  TRANSPORTING: "#8b5cf6", AT_HOSPITAL: "#f59e0b", OFF_DUTY: "#9ca3af", MAINTENANCE: "#ef4444",
}

export function AmbulancePanel() {
  const [ambulances, setAmbulances] = useState<any[]>([])
  useEffect(() => { ambulancesApi.getAll().then(r => setAmbulances(Array.isArray(r.data) ? r.data : [])) }, [])
  return (
    <div>
      {ambulances.map((amb: any) => (
        <div key={amb.id} style={{ padding: "10px 14px", borderBottom: "1px solid #e8eef8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0f2952" }}>{amb.registration_no}</div>
            <span style={{ fontSize: 10, background: `${STATUS_COLOR[amb.status] || "#9ca3af"}22`, color: STATUS_COLOR[amb.status] || "#9ca3af", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{amb.status}</span>
          </div>
          <div style={{ fontSize: 11, color: "#6b87b0", marginTop: 3 }}>{amb.district} · {amb.ambulance_type}</div>
          {amb.current_lat && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>📍 {amb.current_lat?.toFixed(4)}, {amb.current_lon?.toFixed(4)}</div>}
        </div>
      ))}
      {ambulances.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#6b87b0", fontSize: 13 }}>Loading ambulances...</div>}
    </div>
  )
}
