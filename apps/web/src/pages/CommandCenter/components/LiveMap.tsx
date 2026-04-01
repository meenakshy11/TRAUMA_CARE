import { useEffect, useRef, useState } from "react"
import { useIncidentStore } from "../../../store/incidentStore"
import { useAmbulanceStore } from "../../../store/ambulanceStore"
import { useHospitalStore, useFilteredHospitals } from "../../../store/hospitalStore"
import { useMapStore } from "../../../store/mapStore"
import { getCurrentTheme, getMapTileUrl } from "../../../hooks/useTheme"
import { DEMO_BLACKSPOTS } from "../../../api/demo-fixtures"

declare global { interface Window { L: any } }

// ── Color helpers ─────────────────────────────────────────────────────────────
const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "var(--color-critical)",
  SEVERE:   "var(--color-warning)",
  MODERATE: "var(--color-accent-blue)",
  MINOR:    "var(--color-success)",
}

/** Trauma level → border colour for hospital marker */
const TRAUMA_LEVEL_COLOR: Record<string, string> = {
  LEVEL_1: "var(--color-critical)",   // red  – highest capability
  LEVEL_2: "var(--color-warning)",    // amber
  LEVEL_3: "var(--color-accent-blue)",// blue – basic
}

function getHospitalMarkerHtml(h: any): string {
  const borderColor = TRAUMA_LEVEL_COLOR[h.trauma_level] ?? "var(--color-accent-blue)"
  const isGovt = h.is_government
  const hasBB  = h.resources?.blood_bank_available

  // Govt hospitals get a solid background fill; private stay hollow
  const bg = isGovt
    ? `background:${borderColor}22; border-color:${borderColor};`
    : `background:var(--color-bg-secondary); border-color:${borderColor};`

  // Tiny blood-bank dot in top-right corner
  const bbDot = hasBB
    ? `<span style="position:absolute;top:-3px;right:-3px;width:8px;height:8px;
                     border-radius:50%;background:#e74c3c;border:1.5px solid #fff;"></span>`
    : ""

  return `
    <div style="position:relative; ${bg}
                border:2.5px solid; border-radius:6px;
                width:26px; height:26px;
                display:flex; align-items:center; justify-content:center;
                font-size:14px; font-weight:800; color:${borderColor};
                box-shadow:0 3px 10px rgba(0,0,0,0.45)">
      +${bbDot}
    </div>`
}

function buildHospitalPopup(h: any): string {
  const level    = h.trauma_level?.replace("_", " ") ?? "—"
  const govLabel = h.is_government ? "🏛 Government" : "🏥 Private"
  const bb       = h.resources?.blood_bank_available ? "✅ Yes" : "❌ No"
  const icu      = `${h.resources?.icu_beds_available ?? 0} / ${h.resources?.icu_beds_total ?? 0}`
  const ed       = `${h.resources?.ed_capacity_current ?? 0} / ${h.resources?.ed_capacity_total ?? 0}`
  const color    = TRAUMA_LEVEL_COLOR[h.trauma_level] ?? "var(--color-accent-blue)"

  return `
    <div class="map-popup">
      <div class="map-popup__num" style="color:${color}">${h.name}</div>
      <div class="map-popup__tags">
        <span>${level}</span> · <span>${govLabel}</span>
      </div>
      <div class="map-popup__desc" style="margin-top:4px; line-height:1.6">
        🩸 Blood Bank: ${bb}<br/>
        🛏 ICU: ${icu}<br/>
        🚨 ED: ${ed}<br/>
        📍 ${h.district}
      </div>
    </div>`
}

// ── Component ─────────────────────────────────────────────────────────────────
export function LiveMap() {
  const mapRef         = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const layerRef       = useRef<any>(null)
  const markersRef     = useRef<any>({
    incidents: {}, ambulances: {}, hospitals: [], blackspots: [], heatmapLayer: null,
  })

  const incidents         = useIncidentStore((s) => s.incidents)
  const positions         = useAmbulanceStore((s) => s.positions)
  const filteredHospitals = useFilteredHospitals()   // ← reactive to hospitals + filters
  const mapStore          = useMapStore()
  const [mapReady, setMapReady] = useState(false)

  // ── Bootstrap Leaflet ───────────────────────────────────────────────────────
  useEffect(() => {
    const script  = document.createElement("script")
    script.src    = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
    script.onload = () => {
      const heatScript     = document.createElement("script")
      heatScript.src       = "https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js"
      heatScript.onload    = () => initMap()
      document.head.appendChild(heatScript)
    }
    document.head.appendChild(script)

    const css  = document.createElement("link")
    css.rel    = "stylesheet"
    css.href   = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
    document.head.appendChild(css)

    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null }
    }
  }, [])

  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current || !window.L) return
    const L   = window.L
    const map = L.map(mapRef.current, { zoomControl: false }).setView([10.5, 76.2], 8)
    const layer = L.tileLayer(getMapTileUrl(getCurrentTheme()), {
      attribution: "&copy; CartoDB", maxZoom: 19,
    }).addTo(map)
    layerRef.current = layer
    L.control.zoom({ position: "bottomright" }).addTo(map)
    L.control.scale({ position: "bottomleft", imperial: false }).addTo(map)
    mapInstanceRef.current = map
    setMapReady(true)
  }

  // Theme changes
  useEffect(() => {
    const handleThemeChange = (e: any) => {
      if (layerRef.current) layerRef.current.setUrl(getMapTileUrl(e.detail.theme))
    }
    window.addEventListener("themechange", handleThemeChange)
    return () => window.removeEventListener("themechange", handleThemeChange)
  }, [])

  // ── Incidents ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!mapReady || !map || !window.L) return
    const L = window.L

    Object.values(markersRef.current.incidents).forEach((m: any) => m.remove())
    markersRef.current.incidents = {}
    if (!mapStore.showIncidents) return

    Object.values(incidents).forEach((inc: any) => {
      const color = SEVERITY_COLOR[inc.severity] || "var(--color-text-muted)"
      const icon  = L.divIcon({
        className: "marker-incident",
        html: `<div style="color:${color}; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.5))">
                 <svg viewBox="0 0 24 24" width="28" height="28" fill="${color}">
                   <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                 </svg>
               </div>`,
        iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28],
      })
      const m = L.marker([inc.latitude, inc.longitude], { icon, zIndexOffset: 1000 }).addTo(map)
      m.bindPopup(`
        <div class="map-popup">
          <div class="map-popup__num" style="color:${color}">${inc.incident_number}</div>
          <div class="map-popup__tags"><span>${inc.severity}</span> · <span>${inc.status?.replace(/_/g," ")}</span></div>
          <div class="map-popup__addr">${inc.district}</div>
        </div>`)
      markersRef.current.incidents[inc.id] = m
    })
  }, [incidents, mapStore.showIncidents, mapReady])

  // ── Ambulances ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!mapReady || !map || !window.L) return
    const L = window.L
    if (!mapStore.showAmbulances) {
      Object.values(markersRef.current.ambulances).forEach((m: any) => m.remove())
      markersRef.current.ambulances = {}
      return
    }
    Object.entries(positions).forEach(([id, pos]: [string, any]) => {
      let statusColor = "var(--color-success)"
      if (pos.status === "DISPATCHED" || pos.status === "ON_SCENE") statusColor = "var(--color-warning)"
      if (pos.status === "TRANSPORTING") statusColor = "var(--color-danger)"
      const icon = L.divIcon({
        className: "marker-ambulance",
        html: `<div style="background:var(--color-bg-secondary); border:3px solid ${statusColor}; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; font-size:15px; box-shadow:0 3px 10px rgba(0,0,0,0.4); color:var(--color-text-primary);">🚑</div>`,
        iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14],
      })
      if (markersRef.current.ambulances[id]) {
        markersRef.current.ambulances[id].setLatLng([pos.lat, pos.lon])
        markersRef.current.ambulances[id].setIcon(icon)
      } else {
        const m = L.marker([pos.lat, pos.lon], { icon, zIndexOffset: 500 }).addTo(map)
        markersRef.current.ambulances[id] = m
      }
    })
  }, [positions, mapStore.showAmbulances, mapReady])

  // ── Hospitals (filtered) ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!mapReady || !map || !window.L) return
    const L = window.L

    // Clear previous markers
    markersRef.current.hospitals.forEach((m: any) => m.remove())
    markersRef.current.hospitals = []
    if (!mapStore.showHospitals) return

    // filteredHospitals is now a plain array — Zustand re-renders this component
    // whenever hospitals or filters change, giving us a fresh array each time.
    filteredHospitals.forEach((h: any) => {
      const icon = L.divIcon({
        className: "marker-hospital",
        html: getHospitalMarkerHtml(h),
        iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -13],
      })
      const m = L.marker([h.latitude, h.longitude], { icon, zIndexOffset: 100 }).addTo(map)
      m.bindPopup(buildHospitalPopup(h))
      markersRef.current.hospitals.push(m)
    })
  }, [filteredHospitals, mapStore.showHospitals, mapReady])
  // Note: filteredHospitals is a function ref from Zustand — calling it inside the
  // effect re-evaluates the filter on every render triggered by hospitals or filters changing.

  // ── Black Spots ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!mapReady || !map || !window.L) return
    const L = window.L
    markersRef.current.blackspots.forEach((m: any) => m.remove())
    markersRef.current.blackspots = []
    if (!mapStore.showBlackSpots) return

    DEMO_BLACKSPOTS.forEach((bs: any) => {
      const icon = L.divIcon({
        className: "marker-blackspot",
        html: `<div style="background:var(--color-bg-secondary); border:2.5px solid var(--color-danger); border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:var(--color-danger); box-shadow:0 3px 10px rgba(0,0,0,0.5)">⚠️</div>`,
        iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12],
      })
      const m = L.marker([bs.latitude, bs.longitude], { icon, zIndexOffset: 200 }).addTo(map)
      m.bindPopup(`
        <div class="map-popup">
          <div class="map-popup__num" style="color:var(--color-danger)">${bs.name}</div>
          <div class="map-popup__tags"><span>Risk Score: ${bs.risk_score}</span></div>
          <div class="map-popup__desc" style="margin-top:4px">${bs.accidents_per_year} accidents/year</div>
        </div>`)
      markersRef.current.blackspots.push(m)
    })
  }, [mapStore.showBlackSpots, mapReady])

  // ── Heatmap ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!mapReady || !map || !window.L || !window.L.heatLayer) return
    const L = window.L

    if (markersRef.current.heatmapLayer) {
      markersRef.current.heatmapLayer.remove()
      markersRef.current.heatmapLayer = null
    }
    if (!mapStore.showHeatmap) return

    const heatPoints: any[] = []
    DEMO_BLACKSPOTS.forEach((bs: any) => {
      heatPoints.push([bs.latitude, bs.longitude, bs.risk_score * 0.1])
    })
    Object.values(incidents).forEach((inc: any) => {
      let intensity = 0.5
      if (inc.severity === "CRITICAL") intensity = 1.0
      if (inc.severity === "SEVERE")   intensity = 0.8
      heatPoints.push([inc.latitude, inc.longitude, intensity])
    })

    markersRef.current.heatmapLayer = L.heatLayer(heatPoints, {
      radius: 35, blur: 25, maxZoom: 12, max: 1.0,
      gradient: { 0.4: "blue", 0.6: "cyan", 0.7: "lime", 0.8: "yellow", 1.0: "red" },
    }).addTo(map)
  }, [incidents, mapStore.showHeatmap, mapReady])

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "100%", background: "var(--color-bg-primary)" }}
    />
  )
}