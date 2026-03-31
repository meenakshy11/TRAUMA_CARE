import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"
import { authApi } from "../../api/index"
import toast from "react-hot-toast"

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
      login(res.data.user, res.data.access_token)
      toast.success(`Welcome, ${res.data.user.full_name}`)
      navigate("/command-center")
    } catch {
      toast.error("Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial, sans-serif" }}>
      <div style={{ width: 400, padding: 40, background: "#111827", borderRadius: 12, border: "1px solid #1f2937" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🚑</div>
          <h1 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700, margin: 0 }}>Government of Kerala</h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Trauma Response & Emergency Management</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "#94a3b8", fontSize: 12, display: "block", marginBottom: 6 }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
              style={{ width: "100%", padding: "10px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#f1f5f9", fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "#94a3b8", fontSize: 12, display: "block", marginBottom: 6 }}>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required
              style={{ width: "100%", padding: "10px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#f1f5f9", fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "12px", background: loading ? "#374151" : "#10b981", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div style={{ marginTop: 24, padding: 12, background: "#1e293b", borderRadius: 6 }}>
          <p style={{ color: "#64748b", fontSize: 11, margin: "0 0 6px" }}>Demo credentials:</p>
          {[
            ["dispatcher@trauma.demo", "Demo@1234", "Dispatcher"],
            ["admin@trauma.demo", "Admin@1234", "Admin"],
            ["hospital@trauma.demo", "Hosp@1234", "Hospital Staff"],
            ["gov@trauma.demo", "Gov@1234", "Government"],
          ].map(([e, p, role]) => (
            <div key={role} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#10b981", fontSize: 11, cursor: "pointer" }} onClick={() => { setEmail(e); setPassword(p) }}>{role}</span>
              <span style={{ color: "#475569", fontSize: 11 }}>{e}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
