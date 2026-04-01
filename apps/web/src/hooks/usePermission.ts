import { useAuthStore } from "../store/authStore"
import { hasPermission, type Role } from "../config/rbac"

export function usePermission(permission: string): boolean {
  const role = useAuthStore((s) => s.user?.role) as Role | undefined
  return hasPermission(role, permission)
}

export function useRole(): Role | undefined {
  return useAuthStore((s) => s.user?.role) as Role | undefined
}
