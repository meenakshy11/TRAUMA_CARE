import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

export function IncidentMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !latitude || !longitude) return

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    })

    // Bright OSM tiles — detailed, Google Maps-like
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    }).addTo(map)

    // Pulsing incident pin
    const icon = L.divIcon({
      className: "",
      html: `
        <div style="position:relative;width:32px;height:32px">
          <div style="
            position:absolute;top:0;left:0;
            width:32px;height:32px;border-radius:50%;
            background:rgba(239,68,68,0.25);
            animation:pulse-ring 1.5s ease-out infinite;
          "></div>
          <div style="
            position:absolute;top:6px;left:6px;
            width:20px;height:20px;border-radius:50%;
            background:#ef4444;border:3px solid #fff;
            box-shadow:0 2px 10px rgba(239,68,68,0.6);
          "></div>
        </div>
        <style>
          @keyframes pulse-ring {
            0%   { transform:scale(0.8); opacity:0.8; }
            100% { transform:scale(2.2); opacity:0; }
          }
        </style>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    L.marker([latitude, longitude], { icon })
      .bindPopup(
        `<div style="font-family:sans-serif;text-align:center;padding:4px 8px">
          <strong style="color:#ef4444;font-size:13px">Incident Location</strong><br/>
          <span style="color:#6b7280;font-size:11px">📍 ${latitude.toFixed(5)}, ${longitude.toFixed(5)}</span>
        </div>`,
        { closeButton: false }
      )
      .addTo(map)
      .openPopup()

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [latitude, longitude])

  return (
    <div
      ref={containerRef}
      style={{ height: 220, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}
      aria-label="Incident location map"
      role="img"
    />
  )
}
