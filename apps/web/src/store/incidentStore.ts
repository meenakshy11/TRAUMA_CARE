/**
 * incidentStore.ts
 *
 * Global Zustand store for managing the active incidents queue.
 * Represents the frontend state of the platform's core incident management module.
 *
 * In long-term production, this store will hydrate on load via robust polling
 * or handle real-time WebSocket events fired by the FastAPI backend to
 * reflect accidents reported by field paramedics instantly.
 */
import { create } from 'zustand';
import { fetchIncidents, updateIncidentStatus } from '@/api/incidents.api';
import type { Incident } from '@/api/incidents.api';

interface IncidentStoreState {
  incidents: Incident[];
  selectedIncidentId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadIncidents: () => Promise<void>;
  setSelectedIncidentId: (id: string | null) => void;
  updateStatus: (id: string, newStatus: string) => Promise<void>;
}

export const useIncidentStore = create<IncidentStoreState>((set, get) => ({
  incidents: [],
  selectedIncidentId: null,
  isLoading: false,
  error: null,

  loadIncidents: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchIncidents();
      set({ incidents: data, isLoading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to load incidents', isLoading: false });
    }
  },

  setSelectedIncidentId: (id) => {
    set({ selectedIncidentId: id });
  },

  updateStatus: async (id, newStatus) => {
    try {
      // Optimistic upate (optional): we could update UI instantly, but
      // expecting a server response is safer for the prototype.
      const updatedIncident = await updateIncidentStatus(id, newStatus);
      
      set((state) => ({
        incidents: state.incidents.map((inc) =>
          inc.id === id ? updatedIncident : inc
        ),
      }));
    } catch (error: any) {
      console.error('Failed to update incident status:', error);
      // To show local errors or toasts here
    }
  },
}));
