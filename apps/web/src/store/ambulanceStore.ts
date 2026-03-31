/**
 * ambulanceStore.ts
 *
 * Global Zustand store holding the mock fleet of ambulances.
 *
 * Role: Handles platform fleet visibility.
 * In a full deployment, this state engine will ingest real-time GPS
 * pings from Android foreground services passing through the backend WebSocket.
 */
import { create } from 'zustand';
import { DEMO_AMBULANCES } from '@/api/demo-fixtures';
import apiClient from '@/api/client';

export type Ambulance = typeof DEMO_AMBULANCES[number];

interface AmbulanceStoreState {
  ambulances: Ambulance[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadAmbulances: () => Promise<void>;
  updateAmbulanceStatus: (id: string, newStatus: string) => void;
  updateAmbulanceLocation: (id: string, lat: number, lon: number) => void;
}

export const useAmbulanceStore = create<AmbulanceStoreState>((set) => ({
  ambulances: [],
  isLoading: false,
  error: null,

  loadAmbulances: async () => {
    set({ isLoading: true, error: null });
    
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

    try {
      if (isDemo) {
        // Mock loading delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({ ambulances: DEMO_AMBULANCES, isLoading: false });
      } else {
        // Fallback for live initialization
        const response = await apiClient.get<Ambulance[]>('/api/v1/ambulances/active');
        set({ ambulances: response.data, isLoading: false });
      }
    } catch (error: any) {
      set({ error: error?.message || 'Failed to load ambulances', isLoading: false });
      // If live mode fails temporarily, fallback to demo data for the prototype
      if (!isDemo) {
         set({ ambulances: DEMO_AMBULANCES, isLoading: false, error: 'Falling back to mock fleet data.' });
      }
    }
  },

  // In demo flow, this could simulate a WebSocket updating an ambulance status
  updateAmbulanceStatus: (id, newStatus) => {
    set((state) => ({
      ambulances: state.ambulances.map((amb) =>
        amb.id === id ? { ...amb, status: newStatus } : amb
      ),
    }));
  },

  // Simulating live GPS pings coming in
  updateAmbulanceLocation: (id, lat, lon) => {
    set((state) => ({
      ambulances: state.ambulances.map((amb) =>
        amb.id === id 
          ? { 
              ...amb, 
              current_lat: lat, 
              current_lon: lon, 
              last_location_at: new Date().toISOString() 
            } 
          : amb
      ),
    }));
  },
}));
