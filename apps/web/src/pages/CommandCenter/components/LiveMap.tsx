import { useEffect, useRef } from "react"
import { useIncidentStore } from "../../../store/incidentStore"
import { useAmbulanceStore } from "../../../store/ambulanceStore"
import { useHospitalStore } from "../../../store/hospitalStore"
import { useMapStore } from "../../../store/mapStore"

declare global { interface Window { L: any } }

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "#ef4444", SEVERE: "#f97316", MODERATE: "#f59e0b", MINOR: "#10b981",
}

export function LiveMap() {
  const mapRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any>({ incidents: {}, ambulances: {}, hospitals: [], blackspots: [] })
  const incidents = useIncidentStore((s) => s.incidents)
  const positions = useAmbulanceStore((s) => s.positions)
  const hospitals = useHospitalStore((s) => s.hospitals)
  const mapStore = useMapStore()

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
    script.onload = () => initMap()
    document.head.appendChild(script)
    const css = document.createElement("link")
    css.rel = "stylesheet"
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
    document.head.appendChild(css)
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null } }
  }, [])

  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current || !window.L) return
    const L = window.L
    const map = L.map(mapRef.current, { zoomControl: false }).setView([10.5, 76.2], 8)

    // Detailed bright OSM tiles — Google Maps-like appearance
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: "bottomright" }).addTo(map)
    L.control.scale({ position: "bottomleft", imperial: false }).addTo(map)
    mapInstanceRef.current = map
  }

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !window.L) return
    const L = window.L
    Object.values(incidents).forEach((inc: any) => {
      const color = SEVERITY_COLOR[inc.severity] || "#64748b"
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;background:${color};border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 8px ${color}99"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7]
      })
      if (markersRef.current.incidents[inc.id]) {
        markersRef.current.incidents[inc.id].setLatLng([inc.latitude, inc.longitude])
      } else {
        const m = L.marker([inc.latitude, inc.longitude], { icon }).addTo(map)
        m.bindPopup(
          `<div style="font-family:sans-serif;min-width:190px;padding:2px">
            <div style="font-size:13px;font-weight:700;color:${color};margin-bottom:4px">${inc.incident_number}</div>
            <div style="font-size:12px;color:#374151">${inc.severity} · ${inc.status?.replace(/_/g," ")}</div>
            <div style="font-size:11px;color:#6b7280;margin-top:3px">📍 ${inc.district || ""}</div>
          </div>`
        )
        markersRef.current.incidents[inc.id] = m
      }
    })
  }, [incidents])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !window.L) return
    const L = window.L
    if (!mapStore.showAmbulances) {
      Object.values(markersRef.current.ambulances).forEach((m: any) => m.remove())
      markersRef.current.ambulances = {}
      return
    }
    Object.entries(positions).forEach(([id, pos]: [string, any]) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:#1d4ed8;border:2.5px solid #fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 3px 10px rgba(29,78,216,0.5)">🚑</div>`,
        iconSize: [28, 28], iconAnchor: [14, 14]
      })
      if (markersRef.current.ambulances[id]) {
        markersRef.current.ambulances[id].setLatLng([pos.lat, pos.lon])
      } else {
        markersRef.current.ambulances[id] = L.marker([pos.lat, pos.lon], { icon }).addTo(map)
      }
    })
  }, [positions, mapStore.showAmbulances])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !window.L) return
    const L = window.L
    markersRef.current.hospitals.forEach((m: any) => m.remove())
    markersRef.current.hospitals = []
    if (!mapStore.showHospitals) return
    Object.values(hospitals).forEach((h: any) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:#fff;border:2.5px solid #1d4ed8;border-radius:5px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:#1d4ed8;box-shadow:0 2px 8px rgba(0,0,0,0.2)">H</div>`,
        iconSize: [26, 26], iconAnchor: [13, 13]
      })
      const m = L.marker([h.latitude, h.longitude], { icon }).addTo(map)
      m.bindPopup(
        `<div style="font-family:sans-serif;min-width:180px;padding:2px">
          <div style="font-size:13px;font-weight:700;color:#1d4ed8;margin-bottom:4px">${h.name}</div>
          <div style="font-size:11px;color:#374151">${h.trauma_level?.replace("_"," ")}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:3px">ICU: ${h.resources?.icu_beds_available || 0}/${h.resources?.icu_beds_total || 0}</div>
        </div>`
      )
      markersRef.current.hospitals.push(m)
    })
  }, [hospitals, mapStore.showHospitals])

  return (
    <div ref={mapRef} style={{ width: "100%", height: "100%", background: "#e8eef4" }} />
  )
}
