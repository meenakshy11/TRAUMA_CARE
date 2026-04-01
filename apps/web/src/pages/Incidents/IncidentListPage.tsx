import { useEffect, useState } from "react"
import { incidentsApi } from "../../api/index"

const STATUS_COLORS: Record<string, string> = {
  REPORTED: "#f59e0b", DISPATCH_PENDING: "#f97316", DISPATCHED: "#3b82f6",
  EN_ROUTE: "#8b5cf6", ON_SCENE: "#06b6d4", TRANSPORTING: "#10b981",
  HOSPITAL_ARRIVED: "#059669", CLOSED: "#9ca3af", CANCELLED: "#ef4444",
}

export function IncidentListPage() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")

  useEffect(() => {
    incidentsApi.getAll().then(r => { setIncidents(Array.isArray(r.data) ? r.data : []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = filter === "ALL" ? incidents : incidents.filter(i => i.status === filter)

  return (
    <div style={{ padding: 24, background: "#f0f4ff", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f2952" }}>Incident Registry</h1>
          <p style={{ color: "#6b87b0", fontSize: 13, margin: "4px 0 0" }}>All trauma incidents — centralized record</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["ALL","REPORTED","DISPATCHED","ON_SCENE","CLOSED"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: "6px 12px", fontSize: 12, border: "1px solid #c8d8f0", borderRadius: 6, background: filter === s ? "#1a3a6b" : "#ffffff", color: filter === s ? "#fff" : "#2d5086", cursor: "pointer", fontWeight: filter === s ? 600 : 400 }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      {loading ? <div style={{ color: "#6b87b0", textAlign: "center", padding: 40 }}>Loading incidents...</div> : (
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #c8d8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f4ff" }}>
                {["Incident #","Type","Severity","District","Patients","Status","Time"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#6b87b0", fontWeight: 600, borderBottom: "1px solid #c8d8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc: any) => (
                <tr key={inc.id} style={{ borderTop: "1px solid #e8eef8" }}>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#1a3a6b", fontWeight: 600 }}>{inc.incident_number}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#0f2952" }}>{inc.accident_type?.replace("_"," ") || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12 }}>
                    <span style={{ background: inc.severity === "CRITICAL" ? "#fef2f2" : inc.severity === "SEVERE" ? "#fff7ed" : "#fefce8", color: inc.severity === "CRITICAL" ? "#dc2626" : inc.severity === "SEVERE" ? "#ea580c" : "#ca8a04", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{inc.severity}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#6b87b0" }}>{inc.district || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, textAlign: "center", color: "#0f2952" }}>{inc.patient_count}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12 }}>
                    <span style={{ background: `${STATUS_COLORS[inc.status] || "#9ca3af"}18`, color: STATUS_COLORS[inc.status] || "#9ca3af", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{inc.status?.replace("_"," ")}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#9ca3af" }}>{inc.created_at ? new Date(inc.created_at).toLocaleTimeString() : "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#6b87b0" }}>No incidents found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
