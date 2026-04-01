/**
 * HospitalMap.tsx
 *
 * Mini Leaflet map showing a single hospital's location
 * using bright, detailed OpenStreetMap tiles (Google Maps style).
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LEVEL_COLORS: Record<string, string> = {
  LEVEL_1: '#ef4444',
  LEVEL_2: '#f59e0b',
  LEVEL_3: '#22c55e',
};

interface HospitalMapProps {
  lat: number;
  lng: number;
  name: string;
  traumaLevel: string;
}

const HospitalMap: React.FC<HospitalMapProps> = ({ lat, lng, name, traumaLevel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 14,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    });

    // Bright, detailed OSM tiles — Google Maps-like
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    }).addTo(map);

    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

    const color = LEVEL_COLORS[traumaLevel] ?? '#3b82f6';

    // Catchment radius circle
    L.circle([lat, lng], {
      radius: 8000,
      color,
      weight: 2,
      fillColor: color,
      fillOpacity: 0.08,
      dashArray: '6 4',
    }).addTo(map);

    // Hospital marker
    const icon = L.divIcon({
      html: `<div style="
        width:38px;height:38px;
        background:${color};
        border:3px solid #fff;
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:18px;font-weight:900;color:#fff;
        box-shadow:0 4px 14px rgba(0,0,0,0.3),0 0 0 4px ${color}44;
      ">H</div>`,
      className: '',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    L.marker([lat, lng], { icon })
      .bindPopup(
        `<div style="font-family:sans-serif;text-align:center;padding:6px 10px;min-width:160px">
          <strong style="color:${color};font-size:13px">${name}</strong><br/>
          <span style="color:#6b7280;font-size:11px;margin-top:3px;display:block">${traumaLevel.replace('_', ' ')}</span>
          <span style="color:#374151;font-size:11px">📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
        </div>`,
        { closeButton: false },
      )
      .addTo(map)
      .openPopup();

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, name, traumaLevel]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
      aria-label={`Map showing ${name} location`}
      role="img"
    />
  );
};

export default HospitalMap;
