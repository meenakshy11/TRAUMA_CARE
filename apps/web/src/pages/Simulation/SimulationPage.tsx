import { useState } from "react"
import { simulationApi } from "../../api/index"

function DevBanner({ feature, description, progress, eta }: any) {
  return (
    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ background: "#fef3c7", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#92400e", fontWeight: 700, whiteSpace: "nowrap" }}>IN DEVELOPMENT</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#78350f", marginBottom: 4 }}>{feature}</div>
        <div style={{ fontSize: 12, color: "#92400e" }}>{description}</div>
        <div style={{ marginTop: 6, background: "#fde68a", borderRadius: 4, height: 4, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #f59e0b, #10b981)", borderRadius: 4 }} />
        </div>
        <div style={{ fontSize: 11, color: "#a16207", marginTop: 3 }}>{progress}% complete{eta ? ` · ETA: ${eta}` : ""}</div>
      </div>
    </div>
  )
}

export function SimulationPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [newBaseLat, setNewBaseLat] = useState("")
  const [newBaseLon, setNewBaseLon] = useState("")
  const [district, setDistrict] = useState("")

  const runSim = async () => {
    setLoading(true)
    const res = await simulationApi.run({ district: district || undefined, new_base_lat: newBaseLat ? parseFloat(newBaseLat) : undefined, new_base_lon: newBaseLon ? parseFloat(newBaseLon) : undefined })
    setResult(res.data)
    setLoading(false)
  }

  return (
    <div style={{ padding: 24, background: "#f0f4ff", minHeight: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f2952" }}>Accident Simulation & Coverage Analysis</h1>
        <p style={{ color: "#6b87b0", fontSize: 13, margin: "4px 0 0" }}>Model infrastructure gaps and test hypothetical ambulance base placements</p>
      </div>
      <DevBanner feature="AI-Powered Dispatch Optimization" description="Reinforcement learning model to optimize ambulance pre-positioning based on predicted accident patterns and historical data." progress={28} eta="Q3 2026" />
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
        <div style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: 14, margin: "0 0 16px", color: "#0f2952", fontWeight: 600 }}>Simulation Parameters</h3>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "#2d5086", display: "block", marginBottom: 6, fontWeight: 500 }}>Filter by District</label>
            <select value={district} onChange={e => setDistrict(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "#f8faff", border: "1px solid #c8d8f0", borderRadius: 6, color: "#0f2952", fontSize: 13 }}>
              <option value="">All Districts</option>
              {["Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam","Idukki","Ernakulam","Thrissur","Palakkad","Malappuram","Kozhikode","Wayanad","Kannur","Kasaragod"].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "#2d5086", display: "block", marginBottom: 6, fontWeight: 500 }}>New Ambulance Base — Latitude</label>
            <input value={newBaseLat} onChange={e => setNewBaseLat(e.target.value)} placeholder="e.g. 12.4996" style={{ width: "100%", padding: "8px 10px", background: "#f8faff", border: "1px solid #c8d8f0", borderRadius: 6, color: "#0f2952", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: "#2d5086", display: "block", marginBottom: 6, fontWeight: 500 }}>New Ambulance Base — Longitude</label>
            <input value={newBaseLon} onChange={e => setNewBaseLon(e.target.value)} placeholder="e.g. 74.9981" style={{ width: "100%", padding: "8px 10px", background: "#f8faff", border: "1px solid #c8d8f0", borderRadius: 6, color: "#0f2952", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <button onClick={runSim} disabled={loading} style={{ width: "100%", padding: 12, background: loading ? "#6b87b0" : "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Running..." : "⚡ Run Simulation"}
          </button>
        </div>
        <div>
          {!result ? (
            <div style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: 40, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
              <p style={{ color: "#6b87b0" }}>Configure parameters and run a simulation to see coverage analysis results.</p>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total Black Spots", value: result.total_blackspots, color: "#0f2952" },
                  { label: "Covered (≤60 min)", value: result.covered, color: "#10b981" },
                  { label: "Coverage %", value: `${result.coverage_pct}%`, color: result.coverage_pct >= 80 ? "#10b981" : result.coverage_pct >= 60 ? "#f59e0b" : "#ef4444" },
                ].map(c => (
                  <div key={c.label} style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: "14px 16px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ fontSize: 11, color: "#6b87b0", marginBottom: 6, fontWeight: 500 }}>{c.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 600, marginBottom: 8 }}>💡 AI Recommendation</div>
                <div style={{ fontSize: 14, color: "#0f2952" }}>{result.recommendation}</div>
              </div>
              {result.gaps?.length > 0 && (
                <div style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div style={{ padding: "10px 14px", background: "#fef2f2", fontSize: 13, fontWeight: 600, color: "#dc2626", borderBottom: "1px solid #fecaca" }}>⚠ Coverage Gaps ({result.gaps.length} black spots unreachable within 60 min)</div>
                  {result.gaps.map((g: any) => (
                    <div key={g.blackspot_id} style={{ padding: "10px 14px", borderTop: "1px solid #e8eef8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f2952" }}>{g.name}</div>
                        <div style={{ fontSize: 11, color: "#6b87b0" }}>{g.district} · {g.latitude?.toFixed(4)}, {g.longitude?.toFixed(4)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>{g.min_eta_minutes} min</div>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>min ETA</div>
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
