import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { hospitalApi, type Hospital } from '@/api/hospitals.api';

interface HospitalState {
  hospitals: Hospital[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchHospitals: () => Promise<void>;
  
  // Simulated Actions (Mocking live operations)
  decrementIcuBed: (hospitalId: string) => void;
  incrementIcuBed: (hospitalId: string) => void;
}

export const useHospitalStore = create<HospitalState>()(
  immer((set, get) => ({
    hospitals: [],
    isLoading: false,
    error: null,

    fetchHospitals: async () => {
      // Prevent refetching if we already have the state hydrated during session
      if (get().hospitals.length > 0) return;

      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const data = await hospitalApi.getHospitals();
        set((state) => {
          state.hospitals = data;
          state.isLoading = false;
        });
      } catch (err: unknown) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Failed to fetch hospitals';
          state.isLoading = false;
        });
      }
    },

    decrementIcuBed: (hospitalId) => {
      set((state) => {
        const h = state.hospitals.find((x) => x.id === hospitalId);
        if (h && h.resources.icu_beds_available > 0) {
          h.resources.icu_beds_available -= 1;
        }
      });
    },

    incrementIcuBed: (hospitalId) => {
      set((state) => {
        const h = state.hospitals.find((x) => x.id === hospitalId);
        if (h && h.resources.icu_beds_available < h.resources.icu_beds_total) {
          h.resources.icu_beds_available += 1;
        }
      });
    },
  }))
);
