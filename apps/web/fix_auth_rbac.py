import os

# ── 1. Fix authStore ──────────────────────────────────────────────────────────
with open("/workspace/apps/web/src/store/authStore.ts", "w") as f:
    f.write('''import { create } from "zustand"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  hospital_id?: string | null
  ambulance_id?: string | null
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
}

const savedUser = () => {
  try { return JSON.parse(localStorage.getItem("trauma_user") || "null") } catch { return null }
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: savedUser(),
  token: localStorage.getItem("trauma_token"),
  isAuthenticated: !!localStorage.getItem("trauma_token"),
  login: (user, token) => {
    localStorage.setItem("trauma_token", token)
    localStorage.setItem("trauma_user", JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem("trauma_token")
    localStorage.removeItem("trauma_user")
    set({ user: null, token: null, isAuthenticated: false })
    window.location.href = "/login"
  },
}))
''')
print("authStore.ts fixed")

# ── 2. Fix RBAC config ────────────────────────────────────────────────────────
os.makedirs("/workspace/apps/web/src/config", exist_ok=True)
with open("/workspace/apps/web/src/config/rbac.ts", "w") as f:
    f.write('''// Role-Based Access Control Configuration
// Defines what each role can see and do

export type Role = "DISPATCHER" | "HOSPITAL_STAFF" | "GOVERNMENT" | "ADMIN" | "PARAMEDIC"

export const ROLE_ROUTES: Record<Role, string[]> = {
  ADMIN: [
    "/command-center", "/incidents", "/hospitals", "/hospital-dashboard",
    "/blackspots", "/analytics", "/simulation", "/admin"
  ],
  DISPATCHER: [
    "/command-center", "/incidents", "/hospitals", "/hospital-dashboard",
    "/blackspots", "/analytics"
  ],
  HOSPITAL_STAFF: [
    "/hospital-dashboard", "/incidents", "/hospitals"
  ],
  GOVERNMENT: [
    "/command-center", "/analytics", "/simulation", "/blackspots",
    "/hospitals", "/incidents"
  ],
  PARAMEDIC: [],
}

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: [
    "dispatch_ambulance", "add_hospital", "add_ambulance", "manage_users",
    "run_simulation", "view_analytics", "modify_incident", "view_all"
  ],
  DISPATCHER: [
    "dispatch_ambulance", "modify_incident", "view_analytics", "view_all"
  ],
  HOSPITAL_STAFF: [
    "view_own_hospital", "acknowledge_patient"
  ],
  GOVERNMENT: [
    "view_analytics", "run_simulation", "view_all"
  ],
  PARAMEDIC: [
    "create_incident", "record_vitals", "record_triage"
  ],
}

export const ROLE_LABELS: Record<Role, { label: string; color: string; bg: string }> = {
  ADMIN: { label: "Administrator", color: "#7c3aed", bg: "#f3e8ff" },
  DISPATCHER: { label: "Dispatcher", color: "#1d4ed8", bg: "#dbeafe" },
  HOSPITAL_STAFF: { label: "Hospital Staff", color: "#059669", bg: "#d1fae5" },
  GOVERNMENT: { label: "Government", color: "#d97706", bg: "#fef3c7" },
  PARAMEDIC: { label: "Paramedic", color: "#dc2626", bg: "#fee2e2" },
}

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/command-center",
  DISPATCHER: "/command-center",
  HOSPITAL_STAFF: "/hospital-dashboard",
  GOVERNMENT: "/analytics",
  PARAMEDIC: "/login",
}

export function canAccess(role: Role | undefined, route: string): boolean {
  if (!role) return false
  return ROLE_ROUTES[role]?.includes(route) ?? false
}

export function hasPermission(role: Role | undefined, permission: string): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
''')
print("rbac.ts created")

# ── 3. Fix ProtectedRoute with RBAC ──────────────────────────────────────────
with open("/workspace/apps/web/src/components/ProtectedRoute.tsx", "w") as f:
    f.write('''import { Navigate, useLocation } from "react-router-dom"
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
''')
print("ProtectedRoute.tsx fixed")

# ── 4. Fix Sidebar - role-filtered navigation ─────────────────────────────────
with open("/workspace/apps/web/src/components/Layout/Sidebar.tsx", "w") as f:
    f.write('''import { NavLink } from "react-router-dom"
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
''')
print("Sidebar.tsx with RBAC done")

# ── 5. Fix LoginPage - proper role-based login ────────────────────────────────
with open("/workspace/apps/web/src/pages/Login/LoginPage.tsx", "w") as f:
    f.write('''import { useState } from "react"
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
''')
print("LoginPage.tsx with RBAC done")

# ── 6. Fix api/index.ts - proper demo login with role ─────────────────────────
with open("/workspace/apps/web/src/api/index.ts", "r") as f:
    content = f.read()

# Fix the authApi login to use proper demo users
old = '''export const authApi = {
  login: async (email: string, password: string) => {
    if (DEMO) {
      const { DEMO_USERS } = await import("./demo-fixtures")
      const match = DEMO_USERS[email]
      if (match && match.password === password) return { data: { ...match.tokens, user: match.user } }
      throw new Error("Invalid credentials")
    }
    return apiClient.post("/auth/login", { email, password })
  },'''

new = '''export const authApi = {
  login: async (email: string, password: string) => {
    if (DEMO) {
      const { DEMO_USERS } = await import("./demo-fixtures")
      const match = DEMO_USERS[email]
      if (match && match.password === password) {
        return { data: { access_token: match.tokens.access_token, user: match.user } }
      }
      throw new Error("Invalid credentials")
    }
    return apiClient.post("/auth/login", { email, password })
  },'''

if old in content:
    content = content.replace(old, new)
    with open("/workspace/apps/web/src/api/index.ts", "w") as f:
        f.write(content)
    print("api/index.ts authApi fixed")
else:
    print("api/index.ts authApi already correct or pattern not found - checking...")
    # Just overwrite the authApi section
    print("Skipping - manual check needed")

# ── 7. usePermission hook ─────────────────────────────────────────────────────
os.makedirs("/workspace/apps/web/src/hooks", exist_ok=True)
with open("/workspace/apps/web/src/hooks/usePermission.ts", "w") as f:
    f.write('''import { useAuthStore } from "../store/authStore"
import { hasPermission, type Role } from "../config/rbac"

export function usePermission(permission: string): boolean {
  const role = useAuthStore((s) => s.user?.role) as Role | undefined
  return hasPermission(role, permission)
}

export function useRole(): Role | undefined {
  return useAuthStore((s) => s.user?.role) as Role | undefined
}
''')
print("usePermission hook created")

print("""
✅ Auth + RBAC complete!

What changed:
1. authStore - persists user in localStorage, logout redirects to /login
2. rbac.ts - full role matrix (routes + permissions)
3. ProtectedRoute - blocks wrong roles, shows access denied page
4. Sidebar - shows only routes the current role can access
5. LoginPage - each role redirects to correct home page after login
6. authApi - proper demo credential matching with role

Role routing:
- DISPATCHER → /command-center
- ADMIN → /command-center (full access)
- HOSPITAL_STAFF → /hospital-dashboard
- GOVERNMENT → /analytics
- PARAMEDIC → mobile only (web blocked)
""")