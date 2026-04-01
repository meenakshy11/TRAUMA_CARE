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
      new_base_lon: newBaseLon ? parseFloat(newBaseLon) : undefined 
    })
    setResult(res.data)
    setLoading(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>
          Accident Simulation & Coverage Analysis
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 13, margin: "4px 0 0" }}>
          Model infrastructure gaps and test hypothetical ambulance base placements
        </p>
      </div>

      <DevBanner 
        feature="AI-Powered Dispatch Optimization" 
        description="Reinforcement learning model to optimize ambulance pre-positioning based on predicted accident patterns and historical data." 
        progress={28} 
        eta="Q3 2026" 
      />

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24, alignItems: "start" }}>
        
        {/* Left Side: Parameters */}
        <div className="card" style={{ padding: 24, position: "sticky", top: 24 }}>
          <h3 style={{ fontSize: 13, margin: "0 0 20px", color: "var(--color-text-primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
            Simulation Parameters
          </h3>
          
          <div className="form-field" style={{ marginBottom: 16 }}>
            <label className="form-label">Filter by District</label>
            <select 
              value={district} 
              onChange={e => setDistrict(e.target.value)} 
              className="form-select"
            >
              <option value="">All Districts</option>
              {["Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam","Idukki","Ernakulam","Thrissur","Palakkad","Malappuram","Kozhikode","Wayanad","Kannur","Kasaragod"].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          
          <div className="form-field" style={{ marginBottom: 16 }}>
            <label className="form-label">New Base — Latitude (Optional)</label>
            <input 
              value={newBaseLat} 
              onChange={e => setNewBaseLat(e.target.value)} 
              placeholder="e.g. 12.4996" 
              className="form-input mono" 
            />
          </div>
          
          <div className="form-field" style={{ marginBottom: 28 }}>
            <label className="form-label">New Base — Longitude (Optional)</label>
            <input 
              value={newBaseLon} 
              onChange={e => setNewBaseLon(e.target.value)} 
              placeholder="e.g. 74.9981" 
              className="form-input mono" 
            />
          </div>
          
          <button 
            onClick={runSim} 
            disabled={loading} 
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: 600, display: "flex", justifyContent: "center" }}
          >
            {loading ? (
              <span className="spinner" style={{ marginRight: 8, borderColor: "rgba(255,255,255,0.4)" }} />
            ) : "⚡"} 
            {loading ? "Running Simulation..." : "Run Simulation"}
          </button>
        </div>

        {/* Right Side: Results */}
        <div>
          {!result ? (
            <div className="card" style={{ padding: 64, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>⚡</div>
              <p style={{ color: "var(--color-text-secondary)", fontSize: 15, margin: 0 }}>
                Configure parameters and run a simulation to see coverage analysis results.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 24, animation: "fade-up 300ms ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Analyzed Black Spots", value: result.total_blackspots, color: "var(--color-text-primary)" },
                  { label: "Covered (<60 min)", value: result.covered, color: "var(--color-success)" },
                  { label: "Coverage Reach", value: `${result.coverage_pct}%`, color: result.coverage_pct >= 80 ? "var(--color-success)" : result.coverage_pct >= 60 ? "var(--color-warning)" : "var(--color-danger)" },
                ].map((c, i) => (
                  <div key={i} style={{ background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {c.label}
                    </div>
                    <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: c.color, margin: 0 }}>
                      {c.value}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "var(--radius-md)", padding: "16px 20px", marginBottom: 24, display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ fontSize: 20 }}>💡</div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--color-success)", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
                    AI Recommendation
                  </div>
                  <div style={{ fontSize: 14, color: "var(--color-text-primary)", lineHeight: 1.5 }}>
                    {result.recommendation}
                  </div>
                </div>
              </div>

              {result.gaps?.length > 0 && (
                <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", fontSize: 12, fontWeight: 700, color: "var(--color-danger)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M12 2L1 21h22L12 2zm0 3.83L19.5 19h-15L12 5.83zM11 10h2v5h-2v-5zm0 6h2v2h-2v-2z"/>
                    </svg>
                    Coverage Gaps ({result.gaps.length} unreachable spots within 60 min)
                  </div>
                  
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {result.gaps.map((g: any, idx: number) => (
                      <div key={idx} style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-tertiary)" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{g.name}</div>
                          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                            {g.district} · {g.latitude?.toFixed(4)}, {g.longitude?.toFixed(4)}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--color-danger)" }}>
                            {g.min_eta_minutes}
                          </div>
                          <div style={{ fontSize: 9, color: "var(--color-text-muted)", fontWeight: 700, letterSpacing: "1px" }}>
                            MIN ETA
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
