import { NavLink } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"
import { canAccess, ROLE_LABELS, type Role } from "../../config/rbac"

const ALL_LINKS = [
  { group: "OPERATIONS", to: "/command-center", icon: "🗺", label: "Command Center" },
  { group: "OPERATIONS", to: "/incidents", icon: "🚨", label: "Incidents" },
  { group: "RESOURCES", to: "/hospitals", icon: "🏥", label: "Hospitals" },
  { group: "RESOURCES", to: "/hospital-dashboard", icon: "📋", label: "Hospital Dashboard" },
  { group: "RESOURCES", to: "/blackspots", icon: "⚠️", label: "Black Spots" },
  { group: "INTELLIGENCE", to: "/analytics", icon: "📊", label: "Analytics" },
  { group: "INTELLIGENCE", to: "/simulation", icon: "⚡", label: "Simulation" },
  { group: "SYSTEM", to: "/admin", icon: "⚙️", label: "Administration" },
]

const GROUPS = ["OPERATIONS", "RESOURCES", "INTELLIGENCE", "SYSTEM"]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const role = user?.role as Role | undefined
  const roleConfig = ROLE_LABELS[role || "DISPATCHER"]

  // Filter links by role
  const visibleLinks = ALL_LINKS.filter(l => canAccess(role, l.to))

  return (
    <div style={{ width: 236, background: "#0f2952", display: "flex", flexDirection: "column", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Logo */}
      <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🚑</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#7dd3fc", letterSpacing: 1.5 }}>KERALA TRAUMA</div>
            <div style={{ fontSize: 9, color: "#475569", marginTop: 1, letterSpacing: 0.5 }}>EMERGENCY RESPONSE PLATFORM</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {GROUPS.map(group => {
          const groupLinks = visibleLinks.filter(l => l.group === group)
          if (groupLinks.length === 0) return null
          return (
            <div key={group} style={{ marginBottom: 4 }}>
              <div style={{ padding: "8px 18px 4px", fontSize: 9, fontWeight: 700, color: "#374151", letterSpacing: 1.5 }}>{group}</div>
              {groupLinks.map(l => (
                <NavLink key={l.to} to={l.to} style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 18px", textDecoration: "none",
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#ffffff" : "#94a3b8",
                  background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                  borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent",
                })}>
                  <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{l.icon}</span>
                  {l.label}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {/* Public Report */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <a href="/public-report" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 10px", background: "#ef4444", color: "#fff", textDecoration: "none", borderRadius: 7, fontSize: 12, fontWeight: 700 }}>
          🆘 Public Emergency Report
        </a>
      </div>

      {/* User */}
      <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: roleConfig?.color || "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontWeight: 700, flexShrink: 0 }}>
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.full_name || "Demo User"}</div>
            <span style={{ fontSize: 10, background: roleConfig?.bg || "#dbeafe", color: roleConfig?.color || "#1d4ed8", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
              {roleConfig?.label || role}
            </span>
          </div>
        </div>
        <button onClick={logout}
          style={{ width: "100%", padding: "7px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
