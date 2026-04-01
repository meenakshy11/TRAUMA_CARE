import { useEffect, useState } from "react"
import { blackspotsApi } from "../../api/index"
import toast from "react-hot-toast"

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
    totalAccidents: spots.reduce((sum, s) => sum + (s.accidents_per_year || 0), 0) 
  }

  // Helper for inline risk score bar
  const renderRiskBar = (score: number) => {
    // Normalizing max expected score to 10 for bar width
    const pct = Math.min(100, Math.max(0, (score / 10) * 100))
    const color = pct >= 70 ? "var(--color-danger)" : pct >= 40 ? "var(--color-warning)" : "var(--color-success)"
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100px" }}>
         <span style={{ fontSize: "13px", fontWeight: 700, color, fontFamily: "var(--font-mono)", width: "30px" }}>{score.toFixed(1)}</span>
         <div style={{ flex: 1, height: "6px", background: "var(--color-bg-tertiary)", borderRadius: "99px", overflow: "hidden" }}>
           <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "99px" }} />
         </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>
            Black Spot Management
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 13, margin: "4px 0 0" }}>
            Accident-prone road segments across Kerala
          </p>
        </div>
        <button 
          onClick={() => toast("Add Black Spot form coming soon")} 
          className="btn btn-primary"
        >
          + Add Black Spot
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Black Spots", value: stats.total, color: "var(--color-text-primary)" },
          { label: "Critical (High)", value: stats.high, color: "var(--color-danger)" },
          { label: "Districts Covered", value: stats.districts, color: "var(--color-accent-cyan)" },
          { label: "Total Accidents/yr", value: stats.totalAccidents.toLocaleString(), color: "var(--color-warning)" },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              {c.label}
            </div>
            <div className="mono" style={{ fontSize: 32, fontWeight: 800, color: c.color, margin: "4px 0 0", lineHeight: 1.2 }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["ALL","HIGH","MEDIUM","LOW"].map(s => (
          <button 
            key={s} 
            onClick={() => setFilter(s)} 
            className="btn"
            style={{ 
              padding: "6px 14px", 
              background: filter === s ? "var(--color-accent-blue)" : "transparent", 
              border: filter === s ? "1px solid var(--color-accent-blue)" : "1px solid var(--color-border-strong)",
              color: filter === s ? "#fff" : "var(--color-text-secondary)",
              borderRadius: "99px"
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--color-text-muted)" }}>
            <div className="spinner" style={{ marginBottom: 16, borderColor: "var(--color-text-muted)", borderTopColor: "var(--color-accent-blue)", width: 32, height: 32 }} />
            <div>Loading Black Spots...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--color-text-muted)" }}>
            No black spots found matching criteria.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Road Name</th>
                  <th>District</th>
                  <th>Coordinates</th>
                  <th style={{ textAlign: "center" }}>Accidents/yr</th>
                  <th>Fatality %</th>
                  <th>Risk Score</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any, i: number) => {
                  const sevColor = s.severity === "HIGH" ? "badge-critical" : s.severity === "MEDIUM" ? "badge-warning" : "badge-success"
                  
                  return (
                    <tr key={s.id}>
                      <td className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                        BS-{String(i+1).padStart(4,"0")}
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {s.road_name || s.name || "—"}
                      </td>
                      <td style={{ color: "var(--color-text-secondary)" }}>
                        {s.district}
                      </td>
                      <td className="mono" style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                        {s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}
                      </td>
                      <td className="mono" style={{ textAlign: "center", fontWeight: 600 }}>
                        {s.accidents_per_year}
                      </td>
                      <td className="mono" style={{ color: "var(--color-warning)", fontWeight: 600 }}>
                        {s.fatality_rate ? `${s.fatality_rate}%` : "—"}
                      </td>
                      <td>
                        {renderRiskBar(s.risk_score || 0)}
                      </td>
                      <td>
                        {s.severity ? (
                          <span className={`badge ${sevColor}`}>
                            {s.severity}
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
