import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface MapLayers {
  incidents: boolean;
  ambulances: boolean;
  hospitals: boolean;
  blackspots: boolean;
}

interface MapState {
  // The global visibility flags for the Command Center GIS
  layers: MapLayers;

  // Actions
  toggleLayer: (key: keyof MapLayers) => void;
  setLayer: (key: keyof MapLayers, isVisible: boolean) => void;
  resetLayers: () => void;
}

const DEFAULT_LAYERS: MapLayers = {
  incidents: true,
  ambulances: true,
  hospitals: true,
  blackspots: false, // Hidden by default to prevent clutter
};

export const useMapStore = create<MapState>()(
  immer((set) => ({
    layers: { ...DEFAULT_LAYERS },

    toggleLayer: (key) =>
      set((state) => {
        state.layers[key] = !state.layers[key];
      }),

    setLayer: (key, isVisible) =>
      set((state) => {
        state.layers[key] = isVisible;
      }),

    resetLayers: () =>
      set((state) => {
        state.layers = { ...DEFAULT_LAYERS };
      }),
  }))
);
