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
    const DEMO = import.meta.env.VITE_DEMO_MODE === "true"
    try {
      if (DEMO) {
        // Demo mode: skip real API call, just set a demo user session
        login({ full_name: "Demo User", role: "DISPATCHER", email }, "demo-token")
        toast.success("Welcome (Demo Mode)")
        navigate("/command-center")
        return
      }
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
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f2952 0%, #1a3a6b 50%, #2d5086 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial, sans-serif" }}>
      <div style={{ width: 420, padding: 40, background: "#ffffff", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🚑</div>
          <h1 style={{ color: "#0f2952", fontSize: 22, fontWeight: 700, margin: 0 }}>Government of Kerala</h1>
          <p style={{ color: "#6b87b0", fontSize: 13, marginTop: 4 }}>Trauma Response & Emergency Management</p>
          <div style={{ marginTop: 8, padding: "4px 12px", background: "#e8eef8", borderRadius: 20, display: "inline-block" }}>
            <span style={{ fontSize: 11, color: "#1a3a6b", fontWeight: 600 }}>Integrated Trauma Care Platform v1.0</span>
          </div>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "#2d5086", fontSize: 13, display: "block", marginBottom: 6, fontWeight: 500 }}>Email Address</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
              style={{ width: "100%", padding: "10px 12px", background: "#f8faff", border: "1px solid #c8d8f0", borderRadius: 6, color: "#0f2952", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "#2d5086", fontSize: 13, display: "block", marginBottom: 6, fontWeight: 500 }}>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required
              style={{ width: "100%", padding: "10px 12px", background: "#f8faff", border: "1px solid #c8d8f0", borderRadius: 6, color: "#0f2952", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "12px", background: loading ? "#6b87b0" : "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>
        <div style={{ marginTop: 24, padding: 14, background: "#f0f4ff", borderRadius: 8, border: "1px solid #c8d8f0" }}>
          <p style={{ color: "#6b87b0", fontSize: 11, margin: "0 0 8px", fontWeight: 600 }}>DEMO CREDENTIALS — click to autofill</p>
          {[
            ["dispatcher@trauma.demo", "Demo@1234", "Dispatcher"],
            ["admin@trauma.demo", "Admin@1234", "Admin"],
            ["hospital@trauma.demo", "Hosp@1234", "Hospital Staff"],
            ["gov@trauma.demo", "Gov@1234", "Government"],
          ].map(([e, p, role]) => (
            <div key={role} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, padding: "4px 6px", borderRadius: 4, cursor: "pointer", background: email === e ? "#dbeafe" : "transparent" }}
              onClick={() => { setEmail(e); setPassword(p) }}>
              <span style={{ color: "#1a3a6b", fontSize: 12, fontWeight: 500 }}>{role}</span>
              <span style={{ color: "#6b87b0", fontSize: 11 }}>{e}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
