import React, { useEffect, useRef } from 'react';
import type { Incident } from '@/api/incidents.api';
import { TriageColor } from '@/components/TriageColorBadge';

interface IncidentMapProps {
  incident: Incident;
}

// Map overall incident severity to a color
const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444', // Red
  SEVERE:   '#f97316', // Orange
  MODERATE: '#f59e0b', // Yellow
  MINOR:    '#22c55e', // Green
};

function ensureLeafletCSS() {
  const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
  if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);
  }
}

const IncidentMap: React.FC<IncidentMapProps> = ({ incident }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    ensureLeafletCSS();
    leafletRef.current = 'init';

    import('leaflet').then((L) => {
      // Fix default-icon path broken by bundlers
      // @ts-expect-error patching internal
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const root = mapRef.current!;
      const map = L.map(root, {
        center: [incident.latitude, incident.longitude],
        zoom: 14,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
      });

      // Dark CartoDB tiles
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 19 }
      ).addTo(map);

      // Create a pulsating dot marker
      const color = SEVERITY_COLORS[incident.severity] ?? '#6b7280';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r="10" fill="${color}" fill-opacity="0.8" stroke="white" stroke-width="2"/>
        <circle cx="15" cy="15" r="14" fill="none" stroke="${color}" stroke-opacity="0.4" stroke-width="2">
          <animate attributeName="r" from="10" to="14" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </svg>`;
      
      const icon = L.icon({
        iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      L.marker([incident.latitude, incident.longitude], { icon })
        .addTo(map);

      leafletRef.current = map;

      // Force recalculation of size
      requestAnimationFrame(() => {
        if (leafletRef.current && leafletRef.current !== 'init') {
          leafletRef.current.invalidateSize();
        }
      });
    });

    return () => {
      const m = leafletRef.current;
      if (m && m !== 'init') {
        m.remove();
      }
      leafletRef.current = null;
    };
  }, [incident.latitude, incident.longitude, incident.severity]);

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '200px', 
        borderRadius: 'var(--radius-lg)', 
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        position: 'relative'
      }}
    >
      <div 
        ref={mapRef} 
        style={{ width: '100%', height: '100%', background: '#111' }} 
        aria-label="Incident Location Interactive Map"
      />
      {/* Overlay for non-interactivity hint */}
      <div style={{
        position: 'absolute', bottom: '8px', right: '8px', zIndex: 400,
        background: 'var(--color-bg-primary)', padding: '4px 8px', borderRadius: '4px',
        fontSize: '10px', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)'
      }}>
        LOCKED LOCATION
      </div>
    </div>
  );
};

export default IncidentMap;
