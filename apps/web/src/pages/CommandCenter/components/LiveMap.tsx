/**
 * LiveMap.tsx
 *
 * Interactive Leaflet map for the Command Center.
 * Shows ambulances, incidents, hospitals, and black spots as map markers.
 *
 * Fixes applied:
 *  1. Leaflet CSS is injected via a <link> tag at runtime (avoids bundler issues).
 *  2. The map container div is sized 100% width/height via inline style.
 *  3. map.invalidateSize() is called after mount so Leaflet recalculates dimensions.
 *  4. Kerala is the default centre (10.8505 N, 76.2711 E, zoom 8).
 *  5. BlackSpot circles are re-added on each renderMarkers pass like other layers.
 *  6. Marker cleanup uses a typed ref so stale layers are properly removed.
 */

import React, { useEffect, useRef } from 'react';
import { DEMO_HOSPITALS, DEMO_BLACKSPOTS } from '@/api/demo-fixtures';
import type { MapLayers } from './MapLayerControl';
import { useIncidentStore } from '@/store/incidentStore';
import { useAmbulanceStore } from '@/store/ambulanceStore';

type Hospital  = typeof DEMO_HOSPITALS[number];
type BlackSpot = typeof DEMO_BLACKSPOTS[number];

interface LiveMapProps {
  layers: MapLayers;
  selectedIncidentId?: string | null;
  onIncidentClick: (id: string) => void;
}

// ─── Severity / status colour maps ───────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  SEVERE:   '#f97316',
  MODERATE: '#f59e0b',
  MINOR:    '#22c55e',
};

const AMB_STATUS_COLORS: Record<string, string> = {
  AVAILABLE:    '#22c55e',
  DISPATCHED:   '#3b82f6',
  ON_SCENE:     '#f97316',
  TRANSPORTING: '#8b5cf6',
  AT_HOSPITAL:  '#06b6d4',
  MAINTENANCE:  '#6b7280',
  OFF_DUTY:     '#6b7280',
};

// ─── SVG Marker helpers ───────────────────────────────────────────────────────

function makeSvgMarker(fill: string, label: string, size = 28): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${fill}" stroke="white" stroke-width="2.5" opacity="0.93"/>
    <text x="${size / 2}" y="${size / 2 + 4}" font-size="${Math.round(size * 0.38)}"
      text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="bold">${label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

function makeHospitalMarker(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <rect x="1" y="1" width="26" height="26" rx="6" fill="#10b981" stroke="white" stroke-width="2" opacity="0.93"/>
    <line x1="14" y1="7" x2="14" y2="21" stroke="white" stroke-width="3" stroke-linecap="round"/>
    <line x1="7" y1="14" x2="21" y2="14" stroke="white" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

// ─── Inject Leaflet CSS once ──────────────────────────────────────────────────

function ensureLeafletCSS() {
  const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
  if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const LiveMap: React.FC<LiveMapProps> = ({ layers, selectedIncidentId, onIncidentClick }) => {
  const mapRef      = useRef<HTMLDivElement>(null);
  // null  → not yet initialised
  // 'init' → being initialised (guard)
  // Map   → fully ready
  const leafletRef  = useRef<any>(null);
  const markersRef  = useRef<any[]>([]);

  const isDemo   = import.meta.env.VITE_DEMO_MODE === 'true';
  const incidents  = useIncidentStore((s) => s.incidents);
  const ambulances = useAmbulanceStore((s) => s.ambulances);

  // ── Initialise map once ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    ensureLeafletCSS();
    leafletRef.current = 'init'; // guard against double-fire

    import('leaflet').then((L) => {
      // Fix default-icon path broken by bundlers
      // @ts-expect-error patching internal
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Kerala defaults – override via .env if needed
      const mapLat  = Number(import.meta.env.VITE_MAP_DEFAULT_LAT  ?? 10.8505);
      const mapLng  = Number(import.meta.env.VITE_MAP_DEFAULT_LNG  ?? 76.2711);
      const mapZoom = Number(import.meta.env.VITE_MAP_DEFAULT_ZOOM ?? 8);

      const map = L.map(mapRef.current!, {
        center:             [mapLat, mapLng],
        zoom:               mapZoom,
        zoomControl:        false,
        attributionControl: true,
      });

      // Dark CartoDB tiles – ideal for EMS dashboards
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> ' +
            '&copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        },
      ).addTo(map);

      // Zoom control — bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      leafletRef.current = map;

      // CRITICAL: tell Leaflet the true container size after first paint
      requestAnimationFrame(() => {
        map.invalidateSize();
        renderMarkers(L, map);
      });
    });

    return () => {
      const m = leafletRef.current;
      if (m && m !== 'init') {
        m.remove();
      }
      leafletRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-render markers when data / layers / selection change ─────────────
  useEffect(() => {
    const m = leafletRef.current;
    if (!m || m === 'init') return;
    import('leaflet').then((L) => renderMarkers(L, m));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, selectedIncidentId, incidents, ambulances]);

  // ── Marker rendering ──────────────────────────────────────────────────────
  function renderMarkers(L: typeof import('leaflet'), map: import('leaflet').Map) {
    // Remove existing layers
    markersRef.current.forEach((layer) => map.removeLayer(layer));
    markersRef.current = [];

    const hospitals:  Hospital[]  = isDemo ? DEMO_HOSPITALS  : [];
    const blackspots: BlackSpot[] = isDemo ? DEMO_BLACKSPOTS : [];

    // ── Incidents ──────────────────────────────────────────────────────────
    if (layers.incidents) {
      incidents.forEach((inc) => {
        const color      = SEVERITY_COLORS[inc.severity] ?? '#6b7280';
        const isSelected = inc.id === selectedIncidentId;
        const sz         = isSelected ? 36 : 28;
        const icon = L.icon({
          iconUrl:    makeSvgMarker(color, '!', sz),
          iconSize:   [sz, sz],
          iconAnchor: [sz / 2, sz / 2],
        });
        const marker = L.marker([inc.latitude, inc.longitude], { icon })
          .addTo(map)
          .bindPopup(
            `<div class="map-popup">
              <div class="map-popup__num">${inc.incident_number}</div>
              <div class="map-popup__addr">${inc.address_text}</div>
              <div class="map-popup__tags">
                <span style="color:${color}">${inc.severity}</span> ·
                ${inc.status.replace(/_/g, ' ')} ·
                👤 ${inc.patient_count}
              </div>
              <div class="map-popup__desc">${inc.description}</div>
            </div>`,
            { maxWidth: 260 },
          );
        marker.on('click', () => onIncidentClick(inc.id));
        markersRef.current.push(marker);
      });
    }

    // ── Ambulances ─────────────────────────────────────────────────────────
    if (layers.ambulances) {
      ambulances
        .filter((a) => a.is_active)
        .forEach((amb) => {
          const color = AMB_STATUS_COLORS[amb.status] ?? '#6b7280';
          const icon  = L.icon({
            iconUrl:    makeSvgMarker(color, 'A', 26),
            iconSize:   [26, 26],
            iconAnchor: [13, 13],
          });
          const marker = L.marker([amb.current_lat, amb.current_lon], { icon })
            .addTo(map)
            .bindPopup(
              `<div class="map-popup">
                <div class="map-popup__num">${amb.registration_no}</div>
                <div class="map-popup__tags">
                  <span>${amb.ambulance_type}</span> ·
                  <span style="color:${color}">${amb.status.replace(/_/g, ' ')}</span>
                </div>
                <div class="map-popup__addr">${amb.district}</div>
              </div>`,
              { maxWidth: 200 },
            );
          markersRef.current.push(marker);
        });
    }

    // ── Hospitals ──────────────────────────────────────────────────────────
    if (layers.hospitals) {
      hospitals.forEach((h) => {
        const icon = L.icon({
          iconUrl:    makeHospitalMarker(),
          iconSize:   [28, 28],
          iconAnchor: [14, 14],
        });
        const icuAvail = h.resources.icu_beds_available;
        const marker = L.marker([h.latitude, h.longitude], { icon })
          .addTo(map)
          .bindPopup(
            `<div class="map-popup">
              <div class="map-popup__num">${h.name}</div>
              <div class="map-popup__tags">
                ${h.trauma_level.replace(/_/g, ' ')} · ${h.district}
              </div>
              <div class="map-popup__addr">
                ICU: ${icuAvail}/${h.resources.icu_beds_total} free ·
                OT: ${h.resources.ot_available ? '✓' : '✗'}
              </div>
            </div>`,
            { maxWidth: 220 },
          );
        markersRef.current.push(marker);
      });
    }

    // ── Black Spots (danger-zone circles) ─────────────────────────────────
    if (layers.blackspots) {
      blackspots.forEach((bs) => {
        // Radius scales with incident_count, clamped between 300 m and 1 200 m
        const radius = Math.min(Math.max(bs.incident_count * 10, 300), 1200);

        const circle = (L as any).circle([bs.latitude, bs.longitude], {
          radius,
          color:       '#ef4444',
          fillColor:   '#f97316',
          fillOpacity: 0.35,
          weight:      2,
          interactive: true,
        })
          .addTo(map)
          .bindPopup(
            `<div class="map-popup">
              <div class="map-popup__num" style="color:#ef4444;">⚠️ High-Risk Zone</div>
              <div class="map-popup__addr">${bs.name}</div>
              <div class="map-popup__tags">
                <span>Risk Score: ${bs.risk_score}/10</span> ·
                <span style="color:#f8fafc">${bs.incident_count} Incidents</span>
              </div>
              <div class="map-popup__desc">${bs.road_name}</div>
            </div>`,
            { maxWidth: 240 },
          );

        markersRef.current.push(circle);
      });
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      aria-label="Live operational map — Kerala, India"
    >
      <div
        ref={mapRef}
        id="command-center-map"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default LiveMap;