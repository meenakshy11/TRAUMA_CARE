import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"
import { ROLE_HOME, type Role } from "../../config/rbac"
import { authApi } from "../../api/index"
import toast from "react-hot-toast"

const DEMO_ROLES = [
  { label: "Dispatcher", email: "dispatcher@trauma.demo", password: "Demo@1234", role: "DISPATCHER" },
  { label: "Admin", email: "admin@trauma.demo", password: "Admin@1234", role: "ADMIN" },
  { label: "Hospital Staff", email: "hospital@trauma.demo", password: "Hosp@1234", role: "HOSPITAL_STAFF" },
  { label: "Government", email: "gov@trauma.demo", password: "Gov@1234", role: "GOVERNMENT" },
]

export function LoginPage() {
  const [email, setEmail] = useState("dispatcher@trauma.demo")
  const [password, setPassword] = useState("Demo@1234")
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      const user = res.data.user
      const token = res.data.access_token
      login(user, token)
      toast.success(`Welcome, ${user.full_name}`)
      // Redirect based on role
      const home = ROLE_HOME[user.role as Role] || "/command-center"
      navigate(home)
    } catch {
      toast.error("Invalid credentials. Please check your email and password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      {/* Left Panel */}
      <div style={{ width: "45%", background: "linear-gradient(160deg, #0f2952 0%, #1a3a6b 60%, #1e4d8c 100%)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 48px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.04) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 48 }}>
            <div style={{ width: 52, height: 52, background: "rgba(255,255,255,0.12)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🚑</div>
            <div>
              <div style={{ fontSize: 11, color: "#7dd3fc", fontWeight: 700, letterSpacing: 2 }}>GOVERNMENT OF KERALA</div>
              <div style={{ fontSize: 13, color: "#93c5fd", marginTop: 2 }}>Health & Family Welfare Department</div>
            </div>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", lineHeight: 1.2, margin: "0 0 16px" }}>Integrated Trauma Care Platform</h1>
          <p style={{ fontSize: 15, color: "#93c5fd", lineHeight: 1.7, margin: "0 0 48px" }}>Coordinating emergency response across ambulances, hospitals, and command centers for faster trauma care across Kerala.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "🗺", text: "Real-time geospatial command center" },
              { icon: "⚡", text: "Automated ambulance dispatch algorithm" },
              { icon: "🏥", text: "Hospital resource visibility & pre-arrival alerts" },
              { icon: "📊", text: "Golden Hour compliance analytics" },
            ].map(f => (
              <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.08)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{f.icon}</div>
                <span style={{ fontSize: 14, color: "#bfdbfe" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1, marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600 }}>Quantumweave Intelligence Pvt. Ltd.</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Platform v1.0 · KSUM Initiative · 2026</div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, background: "#f8faff", display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: "#0f2952", margin: "0 0 8px" }}>Sign in to your account</h2>
            <p style={{ fontSize: 14, color: "#6b87b0", margin: 0 }}>Access is restricted to authorised personnel only</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email Address</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
                style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#0f172a", background: "#ffffff", boxSizing: "border-box", outline: "none" }}
                onFocus={e => e.target.style.borderColor = "#1a3a6b"}
                onBlur={e => e.target.style.borderColor = "#d1d5db"} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" required
                style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#0f172a", background: "#ffffff", boxSizing: "border-box", outline: "none" }}
                onFocus={e => e.target.style.borderColor = "#1a3a6b"}
                onBlur={e => e.target.style.borderColor = "#d1d5db"} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "13px", background: loading ? "#6b87b0" : "#1a3a6b", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          {/* Demo accounts */}
          <div style={{ marginTop: 24, padding: 16, background: "#ffffff", borderRadius: 10, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 10, letterSpacing: 1 }}>DEMO ACCOUNTS — CLICK TO SELECT</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {DEMO_ROLES.map(r => (
                <button key={r.label} onClick={() => { setEmail(r.email); setPassword(r.password) }}
                  style={{ padding: "10px 12px", background: email === r.email ? "#eff6ff" : "#f9fafb", border: `1.5px solid ${email === r.email ? "#1a3a6b" : "#e5e7eb"}`, borderRadius: 8, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0f2952" }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{r.email}</div>
                  <div style={{ fontSize: 9, color: "#6b87b0", marginTop: 2 }}>→ {r.role === "HOSPITAL_STAFF" ? "Hospital Dashboard" : r.role === "GOVERNMENT" ? "Analytics" : "Command Center"}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <a href="/public-report" style={{ fontSize: 13, color: "#ef4444", textDecoration: "none", fontWeight: 600 }}>🆘 Report Emergency Without Login</a>
          </div>
        </div>
      </div>
    </div>
  )
}
