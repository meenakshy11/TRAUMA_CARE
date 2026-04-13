import { create } from "zustand"

interface AmbulancePosition { lat: number; lon: number; status: string; updatedAt: string }

interface AmbulanceStore {
  /** Full REST objects keyed by id */
  ambulances: Record<string, any>
  /** Live GPS positions (seeded from REST, updated by WebSocket) */
  positions: Record<string, AmbulancePosition>

  /** Bulk-load from GET /ambulances */
  setAmbulances: (list: any[]) => void
  /** WebSocket location push */
  updatePosition: (id: string, lat: number, lon: number, status: string) => void
  /** Look up the full ambulance record for a given position id */
  getAmbulance: (id: string) => any | undefined
}

export const useAmbulanceStore = create<AmbulanceStore>((set, get) => ({
  ambulances: {},
  positions: {},

  setAmbulances: (list) =>
    set(() => ({
      ambulances: Object.fromEntries(list.map((a: any) => [a.id, a])),
      // Seed positions from REST coordinates so the panel isn't blank before WS connects
      positions: Object.fromEntries(
        list
          .filter((a: any) => a.current_lat != null && a.current_lon != null)
          .map((a: any) => [
            a.id,
            {
              lat: a.current_lat,
              lon: a.current_lon,
              status: a.status ?? "UNKNOWN",
              updatedAt: a.last_location_at ?? new Date().toISOString(),
            },
          ])
      ),
    })),

  updatePosition: (id, lat, lon, status) =>
    set((s) => ({
      positions: {
        ...s.positions,
        [id]: { lat, lon, status, updatedAt: new Date().toISOString() },
      },
    })),

  getAmbulance: (id) => get().ambulances[id],
}))

