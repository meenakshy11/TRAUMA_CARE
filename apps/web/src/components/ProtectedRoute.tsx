import { Navigate } from "react-router-dom"
import { useAuthStore } from "../store/authStore"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const demo = import.meta.env.VITE_DEMO_MODE === "true"
  if (!token && !demo) return <Navigate to="/login" replace />
  return <>{children}</>
}
