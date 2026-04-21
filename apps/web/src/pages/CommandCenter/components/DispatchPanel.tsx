import { useState } from "react"
import { dispatchApi, bloodStockApi } from "../../../api/index"
import toast from "react-hot-toast"

interface Props { incidentId: string; onClose: () => void }

export function DispatchPanel({ incidentId, onClose }: Props) {
  const [rec, setRec] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
  const [bloodGroup, setBloodGroup] = useState("")
  const [bloodResults, setBloodResults] = useState<any[]>([])
  const [bloodSearching, setBloodSearching] = useState(false)

  const searchBlood = async (bg: string) => {
    setBloodGroup(bg)
    if (!bg) { setBloodResults([]); return }
    setBloodSearching(true)
    try {
      const r = await bloodStockApi.searchByBloodGroup(bg)
      setBloodResults(Array.isArray(r.data) ? r.data : [])
    } finally {
      setBloodSearching(false)
    }
  }
  const [selectedAmb, setSelectedAmb] = useState("")
  const [selectedHosp, setSelectedHosp] = useState("")

  const loadRec = async () => {
    setLoading(true)
    const r = await dispatchApi.recommend(incidentId)
    setRec(r.data)
    if (r.data.ambulances?.[0]) setSelectedAmb(r.data.ambulances[0].ambulance_id)
    if (r.data.hospitals?.[0]) setSelectedHosp(r.data.hospitals[0].hospital_id)
    setLoading(false)
  }

  const confirmDispatch = async () => {
    await dispatchApi.confirm({ incident_id: incidentId, ambulance_id: selectedAmb, hospital_id: selectedHosp })
    toast.success("Ambulance dispatched successfully")
    onClose()
  }

  return (
    <div style={{ padding: 16, color: "#f1f5f9", fontFamily: "Arial" }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Dispatch Ambulance</h3>
      {!rec ? (
        <button onClick={loadRec} disabled={loading} style={{ width: "100%", padding: 10, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
          {loading ? "Loading..." : "Get Recommendations"}
        </button>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Select Ambulance</label>
            {rec.ambulances.map((a: any) => (
              <div key={a.ambulance_id} onClick={() => setSelectedAmb(a.ambulance_id)}
                style={{ padding: "8px 10px", background: selectedAmb === a.ambulance_id ? "#1e3a5f" : "#1e293b", border: `1px solid ${selectedAmb === a.ambulance_id ? "#3b82f6" : "#334155"}`, borderRadius: 6, marginBottom: 6, cursor: "pointer" }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{a.registration_no} · {a.ambulance_type}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{a.district} · {a.distance_km?.toFixed(1)} km · ETA {a.eta_minutes?.toFixed(0)} min</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Select Hospital</label>
            {rec.hospitals.map((h: any) => (
              <div key={h.hospital_id} onClick={() => setSelectedHosp(h.hospital_id)}
                style={{ padding: "8px 10px", background: selectedHosp === h.hospital_id ? "#1e3a5f" : "#1e293b", border: `1px solid ${selectedHosp === h.hospital_id ? "#3b82f6" : "#334155"}`, borderRadius: 6, marginBottom: 6, cursor: "pointer" }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{h.name}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{h.district} · {h.distance_km?.toFixed(1)} km · ICU: {h.icu_beds_available}</div>
              </div>
            ))}
          </div>
          <button onClick={confirmDispatch} style={{ width: "100%", padding: 10, background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
            Confirm Dispatch
          </button>
        </>
      )}
    
      {/* Blood Group Search */}
      <div style={{ marginTop: 16, padding: 12, background: "var(--color-bg-tertiary)", borderRadius: 8, border: "1px solid var(--color-border)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
          Blood Bank Search
        </div>
        <select
          value={bloodGroup}
          onChange={e => searchBlood(e.target.value)}
          style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--color-border-strong)", background: "var(--color-bg-secondary)", color: "var(--color-text-primary)", fontSize: 13, marginBottom: 8 }}
        >
          <option value="">-- Select Blood Group --</option>
          {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
        </select>
        {bloodSearching && <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Searching...</div>}
        {bloodGroup && !bloodSearching && (
          <div style={{ fontSize: 12, color: "var(--color-accent-green)", fontWeight: 600 }}>
            {bloodResults.length} hospitals have {bloodGroup} available
            {bloodResults.slice(0, 3).map((r: any) => (
              <div key={r.hospital_id} style={{ color: "var(--color-text-secondary)", fontWeight: 400, marginTop: 2 }}>
                 {r.units_available} units
              </div>
            ))}
          </div>
        )}
      </div>
</div>
  )
}
