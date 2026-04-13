import { create } from "zustand"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  hospital_id?: string | null
  hospital_name?: string | null
  ambulance_id?: string | null
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
}

const clearOldKeys = () => {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}

const savedUser = (): User | null => {
  try {
    const u = localStorage.getItem("trauma_user")
    const t = localStorage.getItem("trauma_token")
    if (!u || !t) return null
    return JSON.parse(u)
  } catch { return null }
}

export const useAuthStore = create<AuthStore>((set) => {
  clearOldKeys()
  return {
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
      localStorage.removeItem("access_token")
      set({ user: null, token: null, isAuthenticated: false })
      window.location.replace("/login")
    },
  }
})
