import { useEffect, useState } from "react"
import { incidentsApi } from "../../api/index"

const STATUS_COLORS: Record<string, string> = {
  REPORTED: "#f59e0b", DISPATCH_PENDING: "#f97316", DISPATCHED: "#3b82f6",
  EN_ROUTE: "#8b5cf6", ON_SCENE: "#06b6d4", TRANSPORTING: "#10b981",
  HOSPITAL_ARRIVED: "#6ee7b7", CLOSED: "#64748b", CANCELLED: "#ef4444",
}

export function IncidentListPage() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")

  useEffect(() => {
    incidentsApi.getAll().then(r => {
      setIncidents(Array.isArray(r.data) ? r.data : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = filter === "ALL" ? incidents : incidents.filter(i => i.status === filter)

  return (
    <div style={{ padding: 24, fontFamily: "Arial", color: "#f1f5f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Incident Registry</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>All trauma incidents — centralized record</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["ALL","REPORTED","DISPATCHED","ON_SCENE","CLOSED"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: "6px 12px", fontSize: 12, border: "1px solid #334155", borderRadius: 6, background: filter === s ? "#10b981" : "#1e293b", color: filter === s ? "#fff" : "#94a3b8", cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      {loading ? <div style={{ color: "#64748b", textAlign: "center", padding: 40 }}>Loading incidents...</div> : (
        <div style={{ background: "#111827", borderRadius: 8, border: "1px solid #1f2937", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#1e293b" }}>
                {["Incident #","Type","Severity","District","Patients","Status","Time"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc: any) => (
                <tr key={inc.id} style={{ borderTop: "1px solid #1f2937" }}>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#38bdf8", fontWeight: 500 }}>{inc.incident_number}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{inc.accident_type?.replace("_"," ") || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12 }}>
                    <span style={{ background: inc.severity === "CRITICAL" ? "#ef444422" : inc.severity === "SEVERE" ? "#f9730822" : "#f59e0b22", color: inc.severity === "CRITICAL" ? "#ef4444" : inc.severity === "SEVERE" ? "#f97316" : "#f59e0b", padding: "2px 8px", borderRadius: 4 }}>{inc.severity}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#94a3b8" }}>{inc.district || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, textAlign: "center" }}>{inc.patient_count}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12 }}>
                    <span style={{ background: `${STATUS_COLORS[inc.status] || "#64748b"}22`, color: STATUS_COLORS[inc.status] || "#64748b", padding: "2px 8px", borderRadius: 4 }}>{inc.status?.replace("_"," ")}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b" }}>{inc.created_at ? new Date(inc.created_at).toLocaleTimeString() : "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#64748b" }}>No incidents found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
