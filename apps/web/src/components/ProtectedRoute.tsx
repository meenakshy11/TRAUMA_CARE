import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../store/authStore"
import { canAccess, ROLE_HOME, type Role } from "../config/rbac"

interface Props {
  children: React.ReactNode
  requiredPermission?: string
}

export function ProtectedRoute({ children }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  // Not logged in → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const role = user?.role as Role | undefined

  // Paramedic has no web access
  if (role === "PARAMEDIC") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f1f5f9", fontFamily: "Arial" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
          <h2 style={{ color: "#0f2952", marginBottom: 8 }}>Mobile Access Only</h2>
          <p style={{ color: "#6b87b0" }}>Paramedics access the platform via the mobile app.</p>
          <button onClick={() => useAuthStore.getState().logout()}
            style={{ marginTop: 20, padding: "10px 20px", background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  // Check route access
  if (!canAccess(role, location.pathname)) {
    const home = ROLE_HOME[role || "DISPATCHER"] || "/command-center"
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f1f5f9", fontFamily: "Arial" }}>
        <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: "#0f2952", marginBottom: 8 }}>Access Restricted</h2>
          <p style={{ color: "#6b87b0", marginBottom: 20 }}>Your role <strong>{role}</strong> does not have permission to access this page.</p>
          <a href={home} style={{ padding: "10px 20px", background: "#1a3a6b", color: "#fff", borderRadius: 6, textDecoration: "none", fontWeight: 600, fontSize: 13 }}>
            Go to My Dashboard →
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
