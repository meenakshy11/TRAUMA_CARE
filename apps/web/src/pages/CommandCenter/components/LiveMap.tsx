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
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OSM © CartoDB", subdomains: "abcd", maxZoom: 19
    }).addTo(map)
    L.control.zoom({ position: "bottomright" }).addTo(map)
    mapInstanceRef.current = map
  }

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !window.L) return
    const L = window.L
    Object.values(incidents).forEach((inc: any) => {
      const color = SEVERITY_COLOR[inc.severity] || "#64748b"
      const icon = L.divIcon({ className: "", html: `<div style="width:12px;height:12px;background:${color};border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px ${color}"></div>`, iconSize: [12,12], iconAnchor: [6,6] })
      if (markersRef.current.incidents[inc.id]) {
        markersRef.current.incidents[inc.id].setLatLng([inc.latitude, inc.longitude])
      } else {
        const m = L.marker([inc.latitude, inc.longitude], { icon }).addTo(map)
        m.bindPopup(`<b>${inc.incident_number}</b><br>${inc.severity} · ${inc.status?.replace(/_/g," ")}<br>${inc.district || ""}`)
        markersRef.current.incidents[inc.id] = m
      }
    })
  }, [incidents])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !window.L) return
    const L = window.L
    if (!mapStore.showAmbulances) { Object.values(markersRef.current.ambulances).forEach((m: any) => m.remove()); markersRef.current.ambulances = {}; return }
    Object.entries(positions).forEach(([id, pos]: [string, any]) => {
      const icon = L.divIcon({ className: "", html: `<div style="font-size:18px;filter:drop-shadow(0 0 4px #10b981)">🚑</div>`, iconSize: [20,20], iconAnchor: [10,10] })
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
      const icon = L.divIcon({ className: "", html: `<div style="font-size:16px">🏥</div>`, iconSize: [20,20], iconAnchor: [10,10] })
      const m = L.marker([h.latitude, h.longitude], { icon }).addTo(map)
      m.bindPopup(`<b>${h.name}</b><br>${h.trauma_level?.replace("_"," ")}<br>ICU: ${h.resources?.icu_beds_available || 0}/${h.resources?.icu_beds_total || 0}`)
      markersRef.current.hospitals.push(m)
    })
  }, [hospitals, mapStore.showHospitals])

  return (
    <div ref={mapRef} style={{ width: "100%", height: "100%", background: "#0a0f1e" }} />
  )
}
