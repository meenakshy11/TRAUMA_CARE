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
    <div style={{ width: 220, background: "#060d1a", borderRight: "1px solid #1f2937", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "16px 14px", borderBottom: "1px solid #1f2937" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", letterSpacing: 1 }}>GOVT OF KERALA</div>
        <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>Trauma Response Platform</div>
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
            color: isActive ? "#10b981" : "#94a3b8",
            background: isActive ? "#10b98112" : "transparent",
            borderLeft: isActive ? "2px solid #10b981" : "2px solid transparent",
          })}>
            <span style={{ fontSize: 14 }}>{l.icon}</span> {l.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #1f2937" }}>
        <a href="/public-report" style={{ display: "block", padding: "8px 10px", background: "#ef444420", color: "#ef4444", textDecoration: "none", borderRadius: 6, fontSize: 12, textAlign: "center", fontWeight: 600 }}>
          🆘 Public Report
        </a>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{user?.full_name || "Demo User"}</div>
        <div style={{ fontSize: 11, background: "#10b98120", color: "#10b981", padding: "2px 8px", borderRadius: 10, display: "inline-block", marginBottom: 8 }}>{user?.role || "DISPATCHER"}</div>
        <div><button onClick={logout} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Sign out</button></div>
      </div>
    </div>
  )
}
