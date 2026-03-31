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
    } catch { toast.error("Failed to submit report") }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f2952 0%, #1a3a6b 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 480, background: "#ffffff", borderRadius: 12, padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🆘</div>
          <h1 style={{ color: "#ef4444", fontSize: 22, margin: 0, fontWeight: 700 }}>Report an Accident</h1>
          <p style={{ color: "#6b87b0", fontSize: 13, marginTop: 4 }}>Government of Kerala Emergency Reporting</p>
        </div>
        {submitted ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ color: "#10b981", marginBottom: 8 }}>Report Submitted</h2>
            <p style={{ color: "#6b87b0", marginBottom: 4 }}>Incident Number:</p>
            <p style={{ fontWeight: 700, fontSize: 18, color: "#0f2952", marginBottom: 16 }}>{submitted}</p>
            <p style={{ color: "#6b87b0", fontSize: 13, marginBottom: 20 }}>Emergency services have been notified. Help is on the way.</p>
            <button onClick={() => navigate("/")} style={{ padding: "10px 20px", background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Back to Home</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <button type="button" onClick={getLocation} style={{ width: "100%", padding: 10, background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, marginBottom: 16, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              📍 Use My Current Location
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ color: "#2d5086", fontSize: 12, display: "block", marginBottom: 4, fontWeight: 500 }}>Latitude</label>
                <input value={lat} onChange={e => setLat(e.target.value)} placeholder="8.5241" required style={{ width: "100%", padding: "8px 10px", background: "#f8faff", border: "1px solid #c8d8f0", borderRadius: 6, color: "#0f2952", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ color: "#2d5086", fontSize: 12, display: "block", marginBottom: 4, fontWeight: 500 }}>Longitude</label>
                <input value={lon} onChange={e => setLon(e.target.value)} placeholder="76.9366" required style={{ width: "100%", padding: "8px 10px", background: "#f8faff", border: "1px solid #c8d8f0", borderRadius: 6, color: "#0f2952", fontSize: 13, boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: "#2d5086", fontSize: 12, display: "block", marginBottom: 4, fontWeight: 500 }}>Description</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Describe the accident..." style={{ width: "100%", padding: "8px 10px", background: "#f8faff", border: "1px solid #c8d8f0", borderRadius: 6, color: "#0f2952", fontSize: 13, boxSizing: "border-box", resize: "vertical" }} />
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", padding: 12, background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Submitting..." : "🚨 Report Emergency"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
