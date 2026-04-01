import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { publicApi } from "../../api/index"
import toast from "react-hot-toast"

export function PublicReportPage() {
  const navigate = useNavigate()
  const [lat, setLat] = useState("")
  const [lon, setLon] = useState("")
  const [desc, setDesc] = useState("")
  const [accidentType, setAccidentType] = useState("ROAD_ACCIDENT")
  const [severity, setSeverity] = useState("UNKNOWN")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState("")
  const [locating, setLocating] = useState(false)

  const getLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(String(pos.coords.latitude)); setLon(String(pos.coords.longitude)); setLocating(false) },
      () => { toast.error("Could not get location"); setLocating(false) }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await publicApi.report({ latitude: parseFloat(lat), longitude: parseFloat(lon), description: desc, accident_type: accidentType, severity })
      setSubmitted(res.data.incident_number)
      toast.success("Report submitted. Help is on the way!")
    } catch { toast.error("Failed to submit report") }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #050d1a 0%, #0f1d35 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      {/* Grid decoration */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 500, position: "relative", zIndex: 1 }}>
        {/* Logo header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 16, marginBottom: 16 }}>
            <span style={{ fontSize: 32 }}>🆘</span>
          </div>
          <h1 style={{ color: "#ef4444", fontSize: 26, margin: 0, fontWeight: 800, letterSpacing: "-0.02em" }}>Report an Accident</h1>
          <p style={{ color: "#93c5fd", fontSize: 14, marginTop: 8 }}>Government of Kerala · Emergency Response System</p>
        </div>

        <div style={{ background: "rgba(15,29,53,0.85)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 32, backdropFilter: "blur(12px)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h2 style={{ color: "#10b981", marginBottom: 8, fontSize: 22 }}>Report Submitted!</h2>
              <p style={{ color: "#93afd4", marginBottom: 6, fontSize: 14 }}>Incident Reference Number:</p>
              <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 20, color: "#fff", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "10px 20px", marginBottom: 20, letterSpacing: 1 }}>{submitted}</div>
              <p style={{ color: "#93afd4", fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
                Emergency services have been notified. A dispatcher will contact you shortly.
              </p>
              <button onClick={() => navigate("/login")} style={{ padding: "11px 28px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                Back to Home
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* GPS Button */}
              <button
                type="button"
                onClick={getLocation}
                disabled={locating}
                style={{ width: "100%", padding: "12px", background: "rgba(59,130,246,0.15)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, marginBottom: 20, cursor: "pointer", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}
              >
                📍 {locating ? "Detecting Location..." : "Use My Current Location (GPS)"}
              </button>

              {/* Coordinates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[["Latitude", lat, setLat, "8.5241"], ["Longitude", lon, setLon, "76.9366"]].map(([label, val, setter, placeholder]) => (
                  <div key={label as string}>
                    <label style={{ color: "#93afd4", fontSize: 11, display: "block", marginBottom: 6, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>{label as string}</label>
                    <input
                      value={val as string}
                      onChange={e => (setter as any)(e.target.value)}
                      placeholder={placeholder as string}
                      required
                      className="mono"
                      style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#f1f5f9", fontSize: 13, boxSizing: "border-box", outline: "none" }}
                    />
                  </div>
                ))}
              </div>

              {/* Accident Type */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: "#93afd4", fontSize: 11, display: "block", marginBottom: 6, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Accident Type</label>
                <select
                  value={accidentType}
                  onChange={e => setAccidentType(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#f1f5f9", fontSize: 13, cursor: "pointer" }}
                >
                  {["ROAD_ACCIDENT","FALL","FIRE","DROWNING","ASSAULT","INDUSTRIAL","OTHER"].map(t => (
                    <option key={t} value={t} style={{ background: "#0f1d35" }}>{t.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: "#93afd4", fontSize: 11, display: "block", marginBottom: 6, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Apparent Severity</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["UNKNOWN","MINOR","MODERATE","SEVERE","CRITICAL"].map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSeverity(s)}
                      style={{ flex: 1, padding: "7px 4px", fontSize: 11, fontWeight: 600, borderRadius: 6, border: "1px solid", borderColor: severity === s ? "#ef4444" : "rgba(255,255,255,0.12)", background: severity === s ? "rgba(239,68,68,0.2)" : "transparent", color: severity === s ? "#ef4444" : "#93afd4", cursor: "pointer", transition: "all 0.15s" }}
                    >
                      {s === "UNKNOWN" ? "?" : s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ color: "#93afd4", fontSize: 11, display: "block", marginBottom: 6, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Description (Optional)</label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  rows={3}
                  placeholder="How many vehicles, any visible injuries, special hazards..."
                  style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#f1f5f9", fontSize: 13, boxSizing: "border-box", resize: "vertical", outline: "none" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", padding: "14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.8 : 1, letterSpacing: "-0.01em" }}
              >
                {loading ? "Submitting..." : "🚨 Send Emergency Alert"}
              </button>

              <div style={{ textAlign: "center", marginTop: 16 }}>
                <a href="/login" style={{ color: "#93afd4", fontSize: 12, textDecoration: "none" }}>
                  Already have an account? Sign in →
                </a>
              </div>
            </form>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#4a5568" }}>
          Kerala Integrated Trauma Care Platform · Government of Kerala · 2026
        </div>
      </div>
    </div>
  )
}
