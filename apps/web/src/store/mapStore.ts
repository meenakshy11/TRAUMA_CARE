import { create } from "zustand"

interface MapStore {
  showHospitals: boolean
  showAmbulances: boolean
  showBlackSpots: boolean
  showHeatmap: boolean
  showIncidents: boolean
  toggle: (layer: string) => void
}

export const useMapStore = create<MapStore>((set) => ({
  showHospitals: true,
  showAmbulances: true,
  showBlackSpots: true,
  showHeatmap: false,
  showIncidents: true,
  toggle: (layer) => set((s: any) => ({ [layer]: !s[layer] })),
}))
