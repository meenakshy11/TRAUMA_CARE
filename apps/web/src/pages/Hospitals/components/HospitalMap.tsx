/**
 * HospitalMap.tsx
 *
 * Mini Leaflet map showing a single hospital's location
 * with a styled marker and a radius circle representing
 * the estimated service catchment area.
 *
 * Props:
 *  lat, lng    — coordinates
 *  name        — hospital display name
 *  traumaLevel — 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3'
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
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(map);

    const color = LEVEL_COLORS[traumaLevel] ?? '#3b82f6';

    // Catchment radius circle
    L.circle([lat, lng], {
      radius: 8000,
      color,
      weight: 1,
      fillColor: color,
      fillOpacity: 0.07,
    }).addTo(map);

    // Hospital marker
    const icon = L.divIcon({
      html: `<div style="
        width:36px;height:36px;
        background:${color};
        border:3px solid #fff;
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:16px;font-weight:900;color:#fff;
        box-shadow:0 4px 12px rgba(0,0,0,0.5),0 0 0 4px ${color}44;
      ">H</div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    L.marker([lat, lng], { icon })
      .bindPopup(
        `<div style="font-family:sans-serif;text-align:center;padding:4px 8px">
          <strong style="color:${color};font-size:13px">${name}</strong><br/>
          <span style="color:#94a3b8;font-size:11px">${traumaLevel.replace('_', ' ')}</span>
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
