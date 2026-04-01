import os

THEME = """
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f0f4ff;
  --bg-tertiary: #e8eef8;
  --bg-card: #ffffff;
  --bg-sidebar: #1a3a6b;
  --bg-topbar: #1a3a6b;
  --bg-dark: #0f2952;
  --text-primary: #0f2952;
  --text-secondary: #2d5086;
  --text-muted: #6b87b0;
  --text-white: #ffffff;
  --accent-green: #10b981;
  --accent-blue: #1a3a6b;
  --accent-light-blue: #3b82f6;
  --border: #c8d8f0;
  --border-dark: #a0b8d8;
  --danger: #ef4444;
  --warning: #f59e0b;
  --success: #10b981;
}

body {
  background-color: var(--bg-secondary) !important;
  color: var(--text-primary) !important;
}
"""

# Write globals.css with the new theme
globals_path = "/workspace/apps/web/src/styles/globals.css"
with open(globals_path, "r") as f:
    existing = f.read()

with open(globals_path, "w") as f:
    f.write(THEME + "\n" + existing)

print("Theme variables added to globals.css")

# Update Sidebar to white/blue
sidebar = '''import { NavLink } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"

const links = [
  { to: "/command-center", icon: "🗺", label: "Command Center" },
  { to: "/incidents", icon: "🚨", label: "Incidents" },
  { to: "/hospitals", icon: "🏥", label: "Hospitals" },
  { to: "/hospital-dashboard", icon: "📋", label: "Hospital Dashboard" },
  { to: "/blackspots", icon: "⚠️", label: "Black Spots" },
  { to: "/analytics", icon: "📊", label: "Analytics" },
  { to: "/simulation", icon: "⚡", label: "Simulation" },
  { to: "/admin", icon: "⚙️", label: "Admin" },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  return (
    <div style={{ width: 220, background: "#1a3a6b", borderRight: "1px solid #2d5086", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "16px 14px", borderBottom: "1px solid #2d5086" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#7dd3fc", letterSpacing: 1 }}>GOVT OF KERALA</div>
        <div style={{ fontSize: 10, color: "#93c5fd", marginTop: 2 }}>Trauma Response Platform</div>
      </div>
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {links.map(l => (
          <NavLink key={l.to} to={l.to} style={({ isActive }) => ({
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 14px",
            textDecoration: "none",
            fontSize: 13,
            color: isActive ? "#ffffff" : "#93c5fd",
            background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
            borderLeft: isActive ? "3px solid #7dd3fc" : "3px solid transparent",
          })}>
            <span style={{ fontSize: 14 }}>{l.icon}</span> {l.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: "10px 14px", borderTop: "1px solid #2d5086" }}>
        <a href="/public-report" style={{ display: "block", padding: "8px 10px", background: "#ef4444", color: "#fff", textDecoration: "none", borderRadius: 6, fontSize: 12, textAlign: "center", fontWeight: 600, marginBottom: 10 }}>
          🆘 Public Report
        </a>
      </div>
      <div style={{ padding: "12px 14px", borderTop: "1px solid #2d5086" }}>
        <div style={{ fontSize: 12, color: "#93c5fd", marginBottom: 4 }}>{user?.full_name || "Demo User"}</div>
        <div style={{ fontSize: 11, background: "rgba(125,211,252,0.2)", color: "#7dd3fc", padding: "2px 8px", borderRadius: 10, display: "inline-block", marginBottom: 8 }}>{user?.role || "DISPATCHER"}</div>
        <div><button onClick={logout} style={{ fontSize: 12, color: "#fca5a5", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Sign out</button></div>
      </div>
    </div>
  )
}
'''
with open("/workspace/apps/web/src/components/Layout/Sidebar.tsx", "w") as f:
    f.write(sidebar)
print("Sidebar updated to blue theme")

# Update TopBar
topbar = '''import { useState } from "react"
import { useNotificationStore } from "../../store/notificationStore"

export function TopBar() {
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const notifications = useNotificationStore((s) => s.notifications)
  const markRead = useNotificationStore((s) => s.markRead)
  const [open, setOpen] = useState(false)

  return (
    <div style={{ height: 52, background: "#1a3a6b", borderBottom: "1px solid #2d5086", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 11, background: "rgba(16,185,129,0.2)", color: "#6ee7b7", padding: "3px 8px", borderRadius: 10 }}>● SYSTEM ACTIVE</span>
        <span style={{ fontSize: 11, color: "#93c5fd" }}>{new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
          <span style={{ fontSize: 18 }}>🔔</span>
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", fontSize: 9, borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {unreadCount}
            </span>
          )}
        </div>
        {open && (
          <div style={{ position: "absolute", top: 52, right: 20, width: 360, background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, zIndex: 1000, maxHeight: 320, overflowY: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e8eef8", fontSize: 12, fontWeight: 600, color: "#1a3a6b" }}>Notifications</div>
            {notifications.slice(0, 10).map((n: any) => (
              <div key={n.id} onClick={() => markRead(n.id)} style={{ padding: "10px 14px", borderBottom: "1px solid #e8eef8", background: n.is_read ? "#ffffff" : "#f0f4ff", cursor: "pointer" }}>
                <div style={{ fontSize: 12, color: n.severity === "HIGH" ? "#ef4444" : "#f59e0b" }}>{n.message}</div>
                <div style={{ fontSize: 11, color: "#6b87b0", marginTop: 2 }}>{new Date(n.created_at).toLocaleTimeString()}</div>
              </div>
            ))}
            {notifications.length === 0 && <div style={{ padding: 16, textAlign: "center", color: "#6b87b0", fontSize: 13 }}>No notifications</div>}
          </div>
        )}
      </div>
    </div>
  )
}
'''
with open("/workspace/apps/web/src/components/Layout/TopBar.tsx", "w") as f:
    f.write(topbar)
print("TopBar updated to blue theme")

# Update AppShell background
appshell = '''import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { useWebSocket } from "../../hooks/useWebSocket"

export function AppShell() {
  useWebSocket()
  return (
    <div style={{ display: "flex", height: "100vh", background: "#f0f4ff", fontFamily: "Arial, sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <main style={{ flex: 1, overflow: "auto", background: "#f0f4ff" }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
'''
with open("/workspace/apps/web/src/components/Layout/AppShell.tsx", "w") as f:
    f.write(appshell)
print("AppShell updated")

# Update LoginPage to white/blue
login = '''import { useState } from "react"
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
'''
with open("/workspace/apps/web/src/pages/Login/LoginPage.tsx", "w") as f:
    f.write(login)
print("LoginPage updated to white/blue theme")

print("\nAll theme updates complete!")