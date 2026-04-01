/**
 * CoverageGapMap.tsx
 *
 * Leaflet map showing:
 *  - District choropleth shading by Golden Hour compliance (green → red)
 *  - Circle markers at hospital locations (from demo fixtures)
 *  - Annotation callouts for the 2 highest-risk districts
 *
 * Since Kerala GeoJSON would be large, we simulate coverage zones with
 * radius circles sized by incident volume, centred at each district's
 * primary accident cluster.
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DistrictStat } from '@/api/analytics.api';

// District centroid coordinates
const DISTRICT_CENTROIDS: Record<string, [number, number]> = {
  Ernakulam:          [10.1632, 76.3416],
  Thiruvananthapuram: [8.5241,  76.9366],
  Kozhikode:          [11.2588, 75.7804],
  Thrissur:           [10.5276, 76.2144],
  Kottayam:           [9.5916,  76.5222],
  Palakkad:           [10.7867, 76.6548],
  Kollam:             [8.8932,  76.6141],
};

function goldenColor(pct: number): string {
  if (pct >= 85) return '#22c55e';
  if (pct >= 78) return '#f59e0b';
  if (pct >= 68) return '#f97316';
  return '#ef4444';
}

interface CoverageGapMapProps {
  stats: DistrictStat[];
}

const CoverageGapMap: React.FC<CoverageGapMapProps> = ({ stats }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [10.0, 76.5],
      zoom: 7,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: true,
    });

    // Bright, detailed OSM tiles — Google Maps-like appearance
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.control.scale({ position: 'bottomright', imperial: false }).addTo(map);

    // Draw district coverage zones
    stats.forEach((s) => {
      const coords = DISTRICT_CENTROIDS[s.district];
      if (!coords) return;

      const color   = goldenColor(s.golden_hour_pct);
      const radius  = 15000 + s.total_incidents * 350; // scale with volume

      // Outer halo
      L.circle(coords, {
        radius: radius * 1.4,
        color: 'transparent',
        fillColor: color,
        fillOpacity: 0.07,
      }).addTo(map);

      // Main zone
      const zone = L.circle(coords, {
        radius,
        color,
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.18,
      });

      zone.bindTooltip(
        `<div style="font-family:sans-serif;font-size:12px;min-width:160px">
          <strong style="color:${color}">${s.district}</strong><br/>
          <span style="color:#94a3b8">Golden Hour: <b style="color:${color}">${s.golden_hour_pct}%</b></span><br/>
          <span style="color:#94a3b8">Incidents: ${s.total_incidents} · Avg: ${s.avg_response_min.toFixed(1)} min</span>
        </div>`,
        { sticky: true },
      );

      zone.addTo(map);

      // District label
      L.marker(coords, {
        icon: L.divIcon({
          html: `<div style="font-size:11px;font-weight:800;color:#1e293b;background:${color}22;border:1px solid ${color};padding:2px 6px;border-radius:4px;white-space:nowrap;pointer-events:none;box-shadow:0 1px 4px rgba(0,0,0,0.15)">
            ${s.district}
          </div>`,
          className: '',
          iconAnchor: [0, 0],
        }),
        interactive: false,
      }).addTo(map);

      // Worst response time: add alert pin
      if (s.avg_response_min > 10) {
        L.marker(coords, {
          icon: L.divIcon({
            html: `<div style="
              background:#ef4444;color:#fff;font-size:9px;font-weight:800;
              padding:2px 6px;border-radius:10px;white-space:nowrap;
              box-shadow:0 2px 6px rgba(0,0,0,0.5);transform:translateY(-28px)">
              ⚠ ${s.avg_response_min.toFixed(1)}m avg
            </div>`,
            className: '',
            iconAnchor: [0, 0],
          }),
        }).addTo(map);
      }
    });

    // Hospital markers (from demo data)
    const hospitals = [
      { name: 'GMC Kottayam',    lat: 9.5916,  lon: 76.5222, level: 'L1' },
      { name: 'Jubilee Thrissur',lat: 10.5276, lon: 76.2144, level: 'L2' },
      { name: 'GMC Kozhikode',   lat: 11.2500, lon: 75.7800, level: 'L1' },
      { name: 'SAT TVM',         lat: 8.5241,  lon: 76.9366, level: 'L1' },
    ];

    hospitals.forEach((h) => {
      L.marker([h.lat, h.lon], {
        icon: L.divIcon({
          html: `<div style="
            width:22px;height:22px;background:#fff;border:2px solid #3b82f6;
            border-radius:4px;display:flex;align-items:center;justify-content:center;
            font-size:11px;font-weight:900;color:#1e40af;box-shadow:0 2px 6px rgba(0,0,0,0.4)">
            H
          </div>`,
          className: '',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      })
        .bindTooltip(`<strong>${h.name}</strong><br/><span style="color:#94a3b8">Trauma Level ${h.level}</span>`)
        .addTo(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [stats]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} aria-label="District coverage gap map" role="img" />

      {/* Legend */}
      <div style={legend}>
        <div style={legendTitle}>Golden Hour %</div>
        {[
          { label: '≥ 85%', color: '#22c55e' },
          { label: '78–85%', color: '#f59e0b' },
          { label: '68–78%', color: '#f97316' },
          { label: '< 68%',  color: '#ef4444' },
        ].map(({ label, color }) => (
          <div key={label} style={legendItem}>
            <span style={{ ...legendDot, background: color }} />
            <span style={{ fontSize: 10, color: '#374151' }}>{label}</span>
          </div>
        ))}
        <div style={{ ...legendItem, marginTop: 6, paddingTop: 6, borderTop: '1px solid #e2e8f0' }}>
          <span style={{ ...legendDot, background: '#fff', border: '2px solid #3b82f6', borderRadius: 3 }} />
          <span style={{ fontSize: 10, color: '#374151' }}>Trauma Hospital</span>
        </div>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const legend: React.CSSProperties = {
  position: 'absolute', bottom: 16, left: 16, zIndex: 1000,
  background: 'rgba(255,255,255,0.92)', border: '1px solid #e2e8f0',
  borderRadius: 8, padding: '10px 14px',
  backdropFilter: 'blur(4px)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
  display: 'flex', flexDirection: 'column', gap: 5,
};
const legendTitle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: '#475569',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
};
const legendItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
const legendDot: React.CSSProperties = { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 };

export default CoverageGapMap;
