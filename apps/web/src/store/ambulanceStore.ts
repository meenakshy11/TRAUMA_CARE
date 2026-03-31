import { create } from "zustand"

interface AmbulancePosition { lat: number; lon: number; status: string; updatedAt: string }
interface AmbulanceStore {
  positions: Record<string, AmbulancePosition>
  updatePosition: (id: string, lat: number, lon: number, status: string) => void
}

export const useAmbulanceStore = create<AmbulanceStore>((set) => ({
  positions: {},
  updatePosition: (id, lat, lon, status) =>
    set((s) => ({ positions: { ...s.positions, [id]: { lat, lon, status, updatedAt: new Date().toISOString() } } })),
}))
