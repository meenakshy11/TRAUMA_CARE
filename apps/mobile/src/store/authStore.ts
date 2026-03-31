import { create } from "zustand"

interface AuthStore {
  user: any | null
  token: string | null
  login: (user: any, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}))
