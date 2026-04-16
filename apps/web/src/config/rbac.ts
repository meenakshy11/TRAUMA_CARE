// Role-Based Access Control Configuration
// Defines what each role can see and do

export type Role = "DISPATCHER" | "HOSPITAL_STAFF" | "GOVERNMENT" | "ADMIN" | "PARAMEDIC"

export const ROLE_ROUTES: Record<Role, string[]> = {
  ADMIN: [
    "/command-center", "/incidents", "/hospitals", "/hospital-dashboard",
    "/blackspots", "/analytics", "/simulation", "/admin", "/ambulance-bases"
  ],
  DISPATCHER: [
    "/command-center", "/incidents", "/hospitals", "/hospital-dashboard",
    "/blackspots", "/analytics", "/ambulance-bases"
  ],
  HOSPITAL_STAFF: [
    "/hospital-staff", "/hospital-dashboard", "/incidents", "/hospitals"
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
  HOSPITAL_STAFF: "/hospital-staff",
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
