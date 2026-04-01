import { create } from "zustand"

const DEMO = import.meta.env.VITE_DEMO_MODE === "true"

interface AuthStore {
  user: any | null
  token: string | null
  isAuthenticated: boolean
  login: (user: any, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem("access_token"),
  // In demo mode the user starts as authenticated (no real login needed),
  // but an explicit logout() will always set this to false.
  isAuthenticated: DEMO ? true : !!localStorage.getItem("access_token"),
  login: (user, token) => {
    localStorage.setItem("access_token", token)
    set({ user, token, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem("access_token")
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
