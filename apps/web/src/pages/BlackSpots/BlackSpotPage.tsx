import { useEffect, useState } from "react"
import { blackspotsApi } from "../../api/index"
import toast from "react-hot-toast"

const SEV_COLOR: Record<string, string> = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" }

export function BlackSpotPage() {
  const [spots, setSpots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")

  useEffect(() => {
    blackspotsApi.getAll().then(r => {
      setSpots(Array.isArray(r.data) ? r.data : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = filter === "ALL" ? spots : spots.filter(s => s.severity === filter)
  const stats = {
    total: spots.length,
    high: spots.filter(s => s.severity === "HIGH").length,
    districts: new Set(spots.map(s => s.district)).size,
    totalAccidents: spots.reduce((sum, s) => sum + (s.accidents_per_year || 0), 0),
  }

  return (
    <div style={{ padding: 24, fontFamily: "Arial", color: "#f1f5f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Black Spot Management</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Accident-prone road segments across Kerala</p>
        </div>
        <button onClick={() => toast("Add Black Spot form coming soon")} style={{ padding: "8px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>+ Add Black Spot</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Black Spots", value: stats.total, color: "#ef4444" },
          { label: "Critical (High)", value: stats.high, color: "#f97316" },
          { label: "Districts Covered", value: stats.districts, color: "#3b82f6" },
          { label: "Total Accidents/yr", value: stats.totalAccidents.toLocaleString(), color: "#f59e0b" },
        ].map(c => (
          <div key={c.label} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: c.color, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["ALL","HIGH","MEDIUM","LOW"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "6px 14px", fontSize: 12, background: filter === s ? SEV_COLOR[s] || "#10b981" : "#1e293b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>{s}</button>
        ))}
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Loading...</div> : (
        <div style={{ background: "#111827", borderRadius: 8, border: "1px solid #1f2937", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#0f172a" }}>{["ID","Road Name","District","Coordinates","Accidents/yr","Fatality %","Risk","Severity"].map(h => <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, color: "#64748b" }}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((s: any, i: number) => (
                <tr key={s.id} style={{ borderTop: "1px solid #1f2937" }}>
                  <td style={{ padding: "8px 14px", fontSize: 11, color: "#64748b" }}>BS-{String(i+1).padStart(4,"0")}</td>
                  <td style={{ padding: "8px 14px", fontSize: 13 }}>{s.road_name || s.name || "—"}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "#94a3b8" }}>{s.district}</td>
                  <td style={{ padding: "8px 14px", fontSize: 11, color: "#64748b" }}>{s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}</td>
                  <td style={{ padding: "8px 14px", fontSize: 13, textAlign: "center" }}>{s.accidents_per_year}</td>
                  <td style={{ padding: "8px 14px", fontSize: 13, color: "#f59e0b" }}>{s.fatality_rate ? `${s.fatality_rate}%` : "—"}</td>
                  <td style={{ padding: "8px 14px", fontSize: 13, color: "#f97316" }}>{s.risk_score?.toFixed(1)}</td>
                  <td style={{ padding: "8px 14px" }}>
                    <span style={{ background: `${SEV_COLOR[s.severity] || "#64748b"}22`, color: SEV_COLOR[s.severity] || "#64748b", fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>{s.severity || "—"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
