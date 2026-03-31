import { create } from "zustand"

interface AuthStore {
  user: any | null
  token: string | null
  login: (user: any, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem("access_token"),
  login: (user, token) => {
    localStorage.setItem("access_token", token)
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem("access_token")
    set({ user: null, token: null })
  },
}))
