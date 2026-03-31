/**
 * ambulanceStore.ts
 *
 * Global Zustand store holding the fleet of ambulances.
 *
 * Role: Handles platform fleet visibility.
 *   - `ambulances`  — the full registry (all vehicles, all statuses).
 *                     Used by AmbulanceRegistryPage for admin oversight.
 *   - Data is loaded via `loadFullRegistry()` for the admin view
 *     or `loadAmbulances()` for the live map active-only view.
 *
 * In production, active-map pings come in via WebSocket;
 * the registry is fetched once per session from REST.
 */
import { create } from 'zustand';
import type { Ambulance, AmbulanceStatus } from '@trauma/shared';
import { DEMO_AMBULANCES } from '@/api/demo-fixtures';
import { fetchFleetRegistry } from '@/api/ambulances.api';
import apiClient from '@/api/client';

interface AmbulanceStoreState {
  ambulances: Ambulance[];
  isLoading: boolean;
  error: string | null;
  registryLoaded: boolean;

  // Actions
  loadAmbulances: () => Promise<void>;
  loadFullRegistry: () => Promise<void>;
  updateAmbulanceStatus: (id: string, newStatus: AmbulanceStatus) => void;
  updateAmbulanceLocation: (id: string, lat: number, lon: number) => void;
}

export const useAmbulanceStore = create<AmbulanceStoreState>((set, get) => ({
  ambulances: [],
  isLoading: false,
  error: null,
  registryLoaded: false,

  /** Load active-map ambulances (for Command Center) */
  loadAmbulances: async () => {
    if (get().ambulances.length > 0) return;  // already hydrated
    set({ isLoading: true, error: null });
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
    try {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({ ambulances: DEMO_AMBULANCES as Ambulance[], isLoading: false });
      } else {
        const response = await apiClient.get<Ambulance[]>('/api/v1/ambulances/active');
        set({ ambulances: response.data, isLoading: false });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to load ambulances';
      set({ error: msg, ambulances: DEMO_AMBULANCES as Ambulance[], isLoading: false });
    }
  },

  /** Load the FULL fleet registry (for Admin panel) */
  loadFullRegistry: async () => {
    if (get().registryLoaded) return;
    set({ isLoading: true, error: null });
    try {
      const data = await fetchFleetRegistry();
      set({ ambulances: data as Ambulance[], isLoading: false, registryLoaded: true });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to load fleet registry';
      set({ error: msg, isLoading: false });
    }
  },

  /** Update a vehicle's operational status in-place (instant UI reflection) */
  updateAmbulanceStatus: (id, newStatus) => {
    set((state) => ({
      ambulances: state.ambulances.map((amb) =>
        amb.id === id ? { ...amb, status: newStatus } : amb
      ),
    }));
  },

  /** Simulate live GPS ping updating an ambulance's coordinates */
  updateAmbulanceLocation: (id, lat, lon) => {
    set((state) => ({
      ambulances: state.ambulances.map((amb) =>
        amb.id === id
          ? { ...amb, current_lat: lat, current_lon: lon, last_location_at: new Date().toISOString() }
          : amb
      ),
    }));
  },
}));

