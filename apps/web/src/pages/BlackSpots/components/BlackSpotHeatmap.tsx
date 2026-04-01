/**
 * BlackSpotHeatmap.tsx
 *
 * Renders a full-screen Leaflet map with:
 *  - Circle markers sized/coloured by risk_score for each black spot
 *  - Hover popup with name, risk score, incident count
 *  - Optional "heat blob" simulation via layered translucent circles
 *    (native Leaflet — no external leaflet.heat plugin required)
 *  - Layer toggle: switch between Markers view and Heatmap view
 *
 * Props:
 *   spots      — BlackSpot[]
 *   selected   — currently highlighted spot ID (optional)
 *   onSelect   — callback when user clicks a spot
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BlackSpot } from '@/api/blackspots.api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function riskColor(score: number): string {
  if (score >= 8.5) return '#dc2626'; // Critical — red
  if (score >= 7.0) return '#f97316'; // High     — orange
  if (score >= 5.5) return '#f59e0b'; // Moderate — amber
  return '#22c55e';                   // Low      — green
}

function riskRadius(score: number): number {
  return 800 + score * 400; // metres: 1200m – 4800m
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BlackSpotHeatmapProps {
  spots: BlackSpot[];
  selected: string | null;
  onSelect: (id: string) => void;
  viewMode: 'markers' | 'heatmap';
}

const BlackSpotHeatmap: React.FC<BlackSpotHeatmapProps> = ({
  spots,
  selected,
  onSelect,
  viewMode,
}) => {
  const mapRef    = useRef<L.Map | null>(null);
  const layerRef  = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // ── Init map once ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [10.2, 76.4], // Kerala centre
      zoom: 8,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('© <a href="https://carto.com/" target="_blank">CARTO</a>')
      .addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current   = map;
    setReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Render layers when spots or viewMode changes ──────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current || !layerRef.current) return;

    layerRef.current.clearLayers();

    spots.forEach((spot) => {
      const color    = riskColor(spot.risk_score);
      const isSelected = spot.id === selected;

      if (viewMode === 'heatmap') {
        // ── Heatmap mode: layered glowing blobs ───────────────────────────
        // Outer glow (very transparent)
        L.circle([spot.latitude, spot.longitude], {
          radius: riskRadius(spot.risk_score) * 1.8,
          color: 'transparent',
          fillColor: color,
          fillOpacity: 0.06,
          interactive: false,
        }).addTo(layerRef.current!);

        // Mid ring
        L.circle([spot.latitude, spot.longitude], {
          radius: riskRadius(spot.risk_score),
          color: 'transparent',
          fillColor: color,
          fillOpacity: 0.14,
          interactive: false,
        }).addTo(layerRef.current!);

        // Core hot spot
        const coreCircle = L.circle([spot.latitude, spot.longitude], {
          radius: riskRadius(spot.risk_score) * 0.35,
          color: color,
          weight: isSelected ? 3 : 1,
          fillColor: color,
          fillOpacity: isSelected ? 0.85 : 0.55,
        });

        coreCircle.bindTooltip(
          `<div style="font-family:sans-serif;font-size:12px;line-height:1.4;padding:2px 4px;">
            <strong style="color:${color}">${spot.name}</strong><br/>
            <span style="color:#94a3b8">Risk Score: <b style="color:${color}">${spot.risk_score}/10</b></span><br/>
            <span style="color:#94a3b8">Incidents: ${spot.incident_count}</span>
          </div>`,
          { sticky: true, className: 'dark-tooltip' },
        );

        coreCircle.on('click', () => onSelect(spot.id));
        coreCircle.addTo(layerRef.current!);

      } else {
        // ── Marker mode: pin markers with popup ──────────────────────────
        const svgMarker = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="28" height="37">
            <path d="M18 0C8.059 0 0 8.059 0 18c0 12 18 30 18 30s18-18 18-30C36 8.059 27.941 0 18 0z"
              fill="${color}" stroke="${isSelected ? '#fff' : color}" stroke-width="${isSelected ? 3 : 1}" opacity="0.9"/>
            <text x="18" y="24" text-anchor="middle" font-size="13" font-weight="800"
              fill="#fff" font-family="sans-serif">${Math.round(spot.risk_score)}</text>
          </svg>`;

        const icon = L.divIcon({
          html: svgMarker,
          className: '',
          iconSize:   [28, 37],
          iconAnchor: [14, 37],
          popupAnchor:[0, -37],
        });

        const marker = L.marker([spot.latitude, spot.longitude], { icon });

        marker.bindPopup(
          `<div style="font-family:sans-serif;min-width:200px">
            <div style="font-size:13px;font-weight:800;color:${color};margin-bottom:6px">${spot.name}</div>
            <div style="color:#94a3b8;font-size:11px;margin-bottom:2px">📍 ${spot.road_name} · ${spot.district}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0">
              <div style="background:#1e293b;padding:6px 8px;border-radius:4px;text-align:center">
                <div style="color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:0.06em">Risk Score</div>
                <div style="color:${color};font-size:18px;font-weight:800;font-family:monospace">${spot.risk_score}</div>
              </div>
              <div style="background:#1e293b;padding:6px 8px;border-radius:4px;text-align:center">
                <div style="color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:0.06em">Incidents</div>
                <div style="color:#f1f5f9;font-size:18px;font-weight:800;font-family:monospace">${spot.incident_count}</div>
              </div>
            </div>
            <div style="color:#94a3b8;font-size:11px;line-height:1.5">${spot.description}</div>
          </div>`,
          { maxWidth: 280 },
        );

        marker.on('click', () => onSelect(spot.id));
        marker.addTo(layerRef.current!);
      }
    });

    // Pan to selected spot
    if (selected) {
      const spot = spots.find((s) => s.id === selected);
      if (spot) {
        mapRef.current.flyTo([spot.latitude, spot.longitude], 13, { duration: 1.0 });
      }
    }
  }, [ready, spots, selected, viewMode, onSelect]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
      aria-label="Black spot risk map of Kerala"
      role="img"
    />
  );
};

export default BlackSpotHeatmap;
