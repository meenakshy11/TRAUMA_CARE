import { NavLink } from "react-router-dom"
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
