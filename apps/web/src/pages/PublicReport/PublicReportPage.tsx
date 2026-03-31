import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { publicApi } from "../../api/index"
import toast from "react-hot-toast"

export function PublicReportPage() {
  const navigate = useNavigate()
  const [lat, setLat] = useState("")
  const [lon, setLon] = useState("")
  const [desc, setDesc] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState("")

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(String(pos.coords.latitude)); setLon(String(pos.coords.longitude)) },
      () => toast.error("Could not get location")
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await publicApi.report({ latitude: parseFloat(lat), longitude: parseFloat(lon), description: desc })
      setSubmitted(res.data.incident_number)
      toast.success("Report submitted. Help is on the way!")
    } catch {
      toast.error("Failed to submit report")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 480, background: "#111827", borderRadius: 12, border: "1px solid #1f2937", padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🆘</div>
          <h1 style={{ color: "#ef4444", fontSize: 22, margin: 0 }}>Report an Accident</h1>
          <p style={{ color: "#64748b", fontSize: 13 }}>Government of Kerala Emergency Reporting</p>
        </div>
        {submitted ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ color: "#10b981" }}>Report Submitted</h2>
            <p style={{ color: "#94a3b8" }}>Incident Number: <strong style={{ color: "#f1f5f9" }}>{submitted}</strong></p>
            <p style={{ color: "#64748b", fontSize: 13 }}>Emergency services have been notified. Help is on the way.</p>
            <button onClick={() => navigate("/")} style={{ marginTop: 16, padding: "10px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>Back to Home</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <button type="button" onClick={getLocation} style={{ width: "100%", padding: 10, background: "#1e40af", color: "#fff", border: "none", borderRadius: 6, marginBottom: 16, cursor: "pointer", fontSize: 14 }}>
              📍 Use My Current Location
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ color: "#94a3b8", fontSize: 12, display: "block", marginBottom: 4 }}>Latitude</label>
                <input value={lat} onChange={e => setLat(e.target.value)} placeholder="8.5241" required
                  style={{ width: "100%", padding: "8px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#f1f5f9", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ color: "#94a3b8", fontSize: 12, display: "block", marginBottom: 4 }}>Longitude</label>
                <input value={lon} onChange={e => setLon(e.target.value)} placeholder="76.9366" required
                  style={{ width: "100%", padding: "8px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#f1f5f9", fontSize: 13, boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: "#94a3b8", fontSize: 12, display: "block", marginBottom: 4 }}>Description</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Describe the accident..."
                style={{ width: "100%", padding: "8px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#f1f5f9", fontSize: 13, boxSizing: "border-box", resize: "vertical" }} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: 12, background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Submitting..." : "🚨 Report Emergency"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
