import { create } from "zustand"

interface IncidentStore {
  activeIncident: any | null
  patients: any[]
  setActiveIncident: (incident: any) => void
  addPatient: (patient: any) => void
  clearIncident: () => void
}

export const useIncidentStore = create<IncidentStore>((set) => ({
  activeIncident: null,
  patients: [],
  setActiveIncident: (incident) => set({ activeIncident: incident, patients: [] }),
  addPatient: (patient) => set((s) => ({ patients: [...s.patients, patient] })),
  clearIncident: () => set({ activeIncident: null, patients: [] }),
}))
