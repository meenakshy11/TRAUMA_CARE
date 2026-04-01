import { useEffect, useState } from "react"
import { blackspotsApi } from "../../api/index"
import toast from "react-hot-toast"

const SEV_COLOR: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: "#fef2f2", text: "#dc2626" },
  MEDIUM: { bg: "#fff7ed", text: "#ea580c" },
  LOW: { bg: "#f0fdf4", text: "#16a34a" },
}

export function BlackSpotPage() {
  const [spots, setSpots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")
  useEffect(() => { blackspotsApi.getAll().then(r => { setSpots(Array.isArray(r.data) ? r.data : []); setLoading(false) }).catch(() => setLoading(false)) }, [])
  const filtered = filter === "ALL" ? spots : spots.filter(s => s.severity === filter)
  const stats = { total: spots.length, high: spots.filter(s => s.severity === "HIGH").length, districts: new Set(spots.map(s => s.district)).size, totalAccidents: spots.reduce((sum, s) => sum + (s.accidents_per_year || 0), 0) }

  return (
    <div style={{ padding: 24, background: "#f0f4ff", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f2952" }}>Black Spot Management</h1>
          <p style={{ color: "#6b87b0", fontSize: 13, margin: "4px 0 0" }}>Accident-prone road segments across Kerala</p>
        </div>
        <button onClick={() => toast("Add Black Spot form coming soon")} style={{ padding: "8px 16px", background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Black Spot</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Black Spots", value: stats.total, color: "#ef4444" },
          { label: "Critical (High)", value: stats.high, color: "#f97316" },
          { label: "Districts Covered", value: stats.districts, color: "#1a3a6b" },
          { label: "Total Accidents/yr", value: stats.totalAccidents.toLocaleString(), color: "#f59e0b" },
        ].map(c => (
          <div key={c.label} style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 11, color: "#6b87b0", fontWeight: 500 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["ALL","HIGH","MEDIUM","LOW"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "6px 14px", fontSize: 12, background: filter === s ? "#1a3a6b" : "#ffffff", color: filter === s ? "#fff" : "#2d5086", border: "1px solid #c8d8f0", borderRadius: 6, cursor: "pointer", fontWeight: filter === s ? 600 : 400 }}>{s}</button>
        ))}
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 40, color: "#6b87b0" }}>Loading...</div> : (
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #c8d8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f0f4ff" }}>{["ID","Road Name","District","Coordinates","Accidents/yr","Fatality %","Risk","Severity"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#6b87b0", fontWeight: 600, borderBottom: "1px solid #c8d8f0" }}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((s: any, i: number) => (
                <tr key={s.id} style={{ borderTop: "1px solid #e8eef8" }}>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "#9ca3af" }}>BS-{String(i+1).padStart(4,"0")}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#0f2952" }}>{s.road_name || s.name || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#6b87b0" }}>{s.district}</td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "#9ca3af" }}>{s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, textAlign: "center", color: "#0f2952" }}>{s.accidents_per_year}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#f59e0b", fontWeight: 600 }}>{s.fatality_rate ? `${s.fatality_rate}%` : "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#f97316", fontWeight: 700 }}>{s.risk_score?.toFixed(1)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    {s.severity ? <span style={{ background: SEV_COLOR[s.severity]?.bg || "#f1f5f9", color: SEV_COLOR[s.severity]?.text || "#475569", fontSize: 11, padding: "3px 10px", borderRadius: 4, fontWeight: 600 }}>{s.severity}</span> : <span style={{ color: "#9ca3af" }}>—</span>}
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
