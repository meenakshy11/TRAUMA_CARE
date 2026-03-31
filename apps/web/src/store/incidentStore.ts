import { create } from "zustand"

interface IncidentStore {
  incidents: Record<string, any>
  addIncident: (incident: any) => void
  updateStatus: (id: string, status: string) => void
  setIncidents: (incidents: any[]) => void
}

export const useIncidentStore = create<IncidentStore>((set) => ({
  incidents: {},
  addIncident: (incident) =>
    set((s) => ({ incidents: { ...s.incidents, [incident.id]: incident } })),
  updateStatus: (id, status) =>
    set((s) => ({
      incidents: { ...s.incidents, [id]: s.incidents[id] ? { ...s.incidents[id], status } : { id, status } }
    })),
  setIncidents: (incidents) =>
    set(() => ({ incidents: Object.fromEntries(incidents.map((i: any) => [i.id, i])) })),
}))
