/**
 * MapLayerControl.tsx
 * Toggle buttons to show/hide ambulances, hospitals, and black spots on the map.
 * Tied globally to the mapStore so any part of the app can toggle visibility.
 */
import React from 'react';
import { useMapStore, type MapLayers } from '@/store/mapStore';

export type { MapLayers };

const layersList: { key: keyof MapLayers; label: string; color: string }[] = [
  { key: 'incidents',  label: 'Incidents',  color: '#ef4444' },
  { key: 'ambulances', label: 'Fleet',      color: '#3b82f6' },
  { key: 'hospitals',  label: 'Hospitals',  color: '#10b981' },
  { key: 'blackspots', label: 'Black Spots', color: '#f59e0b' },
];

const MapLayerControl: React.FC = () => {
  const { layers, toggleLayer } = useMapStore();

  return (
    <div className="map-layer-control" role="group" aria-label="Map layers">
      {layersList.map(({ key, label, color }) => (
        <button
          key={key}
          className={`map-layer-btn ${layers[key] ? 'map-layer-btn--active' : ''}`}
          onClick={() => toggleLayer(key)}
          aria-pressed={layers[key]}
          style={layers[key]
            ? { borderColor: color, background: `${color}22`, color }
            : undefined}
          title={`${layers[key] ? 'Hide' : 'Show'} ${label}`}
        >
          <span
            className="map-layer-btn__dot"
            style={{ background: layers[key] ? color : 'var(--color-text-disabled)' }}
            aria-hidden="true"
          />
          {label}
        </button>
      ))}
    </div>
  );
};

export default MapLayerControl;
