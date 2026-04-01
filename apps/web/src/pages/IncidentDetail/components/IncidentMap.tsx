import { useEffect, useRef } from "react"

declare global { interface Window { L: any } }

export function IncidentMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !latitude || !longitude) return

    const ensureLeaflet = (callback: () => void) => {
      if (window.L) { callback(); return }
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
      script.onload = callback
      document.head.appendChild(script)
      if (!document.querySelector('link[href*="leaflet.min.css"]')) {
        const css = document.createElement("link")
        css.rel = "stylesheet"
        css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
        document.head.appendChild(css)
      }
    }

    ensureLeaflet(() => {
      if (!containerRef.current || mapRef.current) return
      const L = window.L
      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
      })

      // Dark CartoDB tiles matching the platform theme
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
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
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [latitude, longitude])

  return (
    <div
      ref={containerRef}
      style={{ height: 220, borderRadius: 8, overflow: "hidden", border: "1px solid var(--color-border)" }}
      aria-label="Incident location map"
      role="img"
    />
  )
}
