import { useState } from "react"
import { simulationApi } from "../../api/index"
import { DevBanner } from "../../components/DevBanner"

export function SimulationPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [newBaseLat, setNewBaseLat] = useState("")
  const [newBaseLon, setNewBaseLon] = useState("")
  const [district, setDistrict] = useState("")

  const runSim = async () => {
    setLoading(true)
    const res = await simulationApi.run({
      district: district || undefined,
      new_base_lat: newBaseLat ? parseFloat(newBaseLat) : undefined,
      new_base_lon: newBaseLon ? parseFloat(newBaseLon) : undefined,
    })
    setResult(res.data)
    setLoading(false)
  }

  return (
    <div style={{ padding: 24, fontFamily: "Arial", color: "#f1f5f9" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Accident Simulation & Coverage Analysis</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Model infrastructure gaps and test hypothetical ambulance base placements</p>
      </div>
      <DevBanner feature="AI-Powered Dispatch Optimization" description="Reinforcement learning model to optimize ambulance pre-positioning based on predicted accident patterns and historical data." progress={28} eta="Q3 2026" />
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: 20 }}>
          <h3 style={{ fontSize: 14, margin: "0 0 16px" }}>Simulation Parameters</h3>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Filter by District (optional)</label>
            <select value={district} onChange={e => setDistrict(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#f1f5f9", fontSize: 13 }}>
              <option value="">All Districts</option>
              {["Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam","Idukki","Ernakulam","Thrissur","Palakkad","Malappuram","Kozhikode","Wayanad","Kannur","Kasaragod"].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>New Ambulance Base — Latitude</label>
            <input value={newBaseLat} onChange={e => setNewBaseLat(e.target.value)} placeholder="e.g. 12.4996" style={{ width: "100%", padding: "8px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#f1f5f9", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>New Ambulance Base — Longitude</label>
            <input value={newBaseLon} onChange={e => setNewBaseLon(e.target.value)} placeholder="e.g. 74.9981" style={{ width: "100%", padding: "8px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#f1f5f9", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <button onClick={runSim} disabled={loading} style={{ width: "100%", padding: 12, background: loading ? "#374151" : "#10b981", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Running Simulation..." : "⚡ Run Simulation"}
          </button>
        </div>
        <div>
          {!result ? (
            <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
              <p style={{ color: "#64748b" }}>Configure parameters and run a simulation to see coverage analysis results.</p>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total Black Spots", value: result.total_blackspots, color: "#f1f5f9" },
                  { label: "Covered (≤60 min)", value: result.covered, color: "#10b981" },
                  { label: "Coverage %", value: `${result.coverage_pct}%`, color: result.coverage_pct >= 80 ? "#10b981" : result.coverage_pct >= 60 ? "#f59e0b" : "#ef4444" },
                ].map(c => (
                  <div key={c.label} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: "14px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{c.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: "#10b981", marginBottom: 8 }}>💡 AI Recommendation</div>
                <div style={{ fontSize: 14, color: "#f1f5f9" }}>{result.recommendation}</div>
              </div>
              {result.gaps?.length > 0 && (
                <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", background: "#1e293b", fontSize: 13, fontWeight: 500, color: "#ef4444" }}>⚠ Coverage Gaps ({result.gaps.length} black spots unreachable within 60 min)</div>
                  {result.gaps.map((g: any) => (
                    <div key={g.blackspot_id} style={{ padding: "10px 14px", borderTop: "1px solid #1f2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{g.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{g.district} · {g.latitude?.toFixed(4)}, {g.longitude?.toFixed(4)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>{g.min_eta_minutes} min</div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>min ETA</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
