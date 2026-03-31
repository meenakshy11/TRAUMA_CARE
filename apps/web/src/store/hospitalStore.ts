import { create } from "zustand"

interface HospitalStore {
  hospitals: Record<string, any>
  setHospitals: (hospitals: any[]) => void
  updateResources: (id: string, resources: any) => void
}

export const useHospitalStore = create<HospitalStore>((set) => ({
  hospitals: {},
  setHospitals: (hospitals) =>
    set(() => ({ hospitals: Object.fromEntries(hospitals.map((h: any) => [h.id, h])) })),
  updateResources: (id, resources) =>
    set((s) => ({
      hospitals: { ...s.hospitals, [id]: s.hospitals[id] ? { ...s.hospitals[id], resources: { ...s.hospitals[id].resources, ...resources } } : { id, resources } }
    })),
}))
