import { useEffect, useRef } from "react"

declare global { interface Window { L: any } }

const MAP_TILE = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"

// 40 km/h × time → metres
const radiusKm = (minutes: number) => (40 * minutes / 60) * 1000

// ── OSRM road routing ─────────────────────────────────────────────────────────
// Uses the public OSRM demo server (no API key required).
// Returns [lat, lng][] ready for Leaflet. Falls back to straight line on error.
async function fetchRoadRoute(
  from: [number, number],  // [lat, lng]
  to:   [number, number],
): Promise<{ coords: [number, number][]; distanceKm: number; durationMin: number }> {
  const OSRM = `https://router.project-osrm.org/route/v1/driving` +
    `/${from[1]},${from[0]};${to[1]},${to[0]}` +
    `?overview=full&geometries=geojson`
  try {
    const res  = await fetch(OSRM, { signal: AbortSignal.timeout(6000) })
    const data = await res.json()
    if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route")
    const route = data.routes[0]
    // OSRM returns [lon, lat] — flip to [lat, lng] for Leaflet
    const coords: [number, number][] = route.geometry.coordinates.map(
      ([lon, lat]: [number, number]) => [lat, lon]
    )
    return {
      coords,
      distanceKm:  Math.round(route.distance / 100) / 10,   // metres → km
      durationMin: Math.round(route.duration / 60 * 10) / 10, // seconds → min
    }
  } catch {
    // Fallback: straight line between the two points
    return { coords: [from, to], distanceKm: 0, durationMin: 0 }
  }
}

interface SimResult {
  nearest_ambulance: string
  ambulance_lat: number
  ambulance_lng: number
  hospital_selected: string
  hospital_lat: number
  hospital_lng: number
  accident_lat: number
  accident_lng: number
}

interface Ambulance {
  id: string
  registration_no: string
  current_lat: number
  current_lon: number
  status: string
  district: string
}

interface Hospital {
  id: string
  name: string
  latitude: number
  longitude: number
  trauma_level?: string
  is_government?: boolean
}

interface BlackSpot {
  name: string
  latitude: number
  longitude: number
  risk_score?: number
}

interface SimulationMapProps {
  onMapClick: (lat: number, lng: number) => void
  simResult: SimResult | null
  ambulances: Ambulance[]
  hospitals: Hospital[]
  blackspots: BlackSpot[]
  showCoverageZones: boolean
  clickedLatLng: { lat: number; lng: number } | null
}

// ── safe addTo: catch Leaflet renderer-not-ready errors ──────────────────────
function safeAdd(layer: any, map: any): boolean {
  try {
    layer.addTo(map)
    return true
  } catch (_) {
    return false
  }
}

export function SimulationMap({
  onMapClick,
  simResult,
  ambulances,
  hospitals,
  blackspots,
  showCoverageZones,
  clickedLatLng,
}: SimulationMapProps) {
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const mapReadyRef    = useRef(false)
  const onMapClickRef  = useRef(onMapClick)

  // latest callback ref — never stale inside Leaflet event handler
  useEffect(() => { onMapClickRef.current = onMapClick }, [onMapClick])

  const markersRef = useRef<any>({
    ambulances:      {} as Record<string, any>,
    hospitals:       [] as any[],
    blackspots:      [] as any[],
    accident:        null as any,
    routeLine:       null as any,
    coverageCircles: [] as any[],
  })

  // ── Bootstrap Leaflet ──────────────────────────────────────────────────────
  useEffect(() => {
    if (mapInstanceRef.current) return

    // CSS
    if (!document.querySelector("link[href*='leaflet.min.css']")) {
      const css = document.createElement("link")
      css.rel   = "stylesheet"
      css.href  = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      document.head.appendChild(css)
    }

    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current || !window.L) return

      // ★ Delay slightly so the browser has painted the container with real dimensions.
      //   Leaflet reads clientWidth/clientHeight on init; if they are 0 the SVG
      //   renderer's _bounds stays null → any L.circle / L.polyline crashes.
      setTimeout(() => {
        if (!mapRef.current || mapInstanceRef.current) return
        const L   = window.L
        const map = L.map(mapRef.current, { zoomControl: false }).setView([9.5, 76.5], 8)

        L.tileLayer(MAP_TILE, { attribution: "© CartoDB", maxZoom: 19 }).addTo(map)
        L.control.zoom({ position: "bottomright" }).addTo(map)
        L.control.scale({ position: "bottomleft", imperial: false }).addTo(map)

        map.on("click", (e: any) => onMapClickRef.current(e.latlng.lat, e.latlng.lng))

        // Force Leaflet to recalculate container + renderer bounds now that
        // the CSS layout has settled.
        map.invalidateSize(false)

        mapInstanceRef.current = map
        mapReadyRef.current    = true
      }, 150)   // 150 ms → one or two paint frames, guaranteed layout
    }

    if (window.L) {
      initMap()
    } else if (!document.querySelector("script[src*='leaflet.min.js']")) {
      const script  = document.createElement("script")
      script.src    = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      // Script tag exists but not yet loaded — wait
      const existing = document.querySelector("script[src*='leaflet.min.js']")!
      existing.addEventListener("load", initMap, { once: true })
    }

    return () => {
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove() } catch (_) {}
        mapInstanceRef.current = null
        mapReadyRef.current    = false
      }
    }
  }, [])

  // ── Helper: run drawing fn inside a timeout+rAF with invalidateSize ─────────
  const drawDeferred = (fn: () => void): (() => void) => {
    const id = window.setTimeout(() => {
      const map = mapInstanceRef.current
      if (!map || !window.L) return
      map.invalidateSize(false)
      requestAnimationFrame(() => {
        if (!mapInstanceRef.current) return
        try { fn() } catch (err) {
          console.warn("SimulationMap draw error (deferred):", err)
        }
      })
    }, 0)
    return () => clearTimeout(id)
  }

  // ── Accident marker ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!mapReadyRef.current || !map || !window.L) return
    const L = window.L
    try { markersRef.current.accident?.remove() } catch (_) {}
    markersRef.current.accident = null
    if (!clickedLatLng) return

    const icon = L.divIcon({
      className: "",
      html: `<div style="width:28px;height:28px;background:rgba(239,68,68,0.2);border:3px solid #ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 0 6px rgba(239,68,68,0.15),0 4px 12px rgba(0,0,0,0.5);">💥</div>`,
      iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14],
    })
    const m = L.marker([clickedLatLng.lat, clickedLatLng.lng], { icon, zIndexOffset: 2000 })
    if (safeAdd(m, map)) {
      m.bindPopup(`<div style="font-family:sans-serif;padding:4px"><b style="color:#ef4444">🚨 Accident</b><br/><span style="font-size:11px;color:#888">${clickedLatLng.lat.toFixed(4)}, ${clickedLatLng.lng.toFixed(4)}</span></div>`)
      markersRef.current.accident = m
    }
  }, [clickedLatLng])

  // ── Route line: ambulance → accident → hospital (real road paths via OSRM) ─
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!mapReadyRef.current || !map || !window.L) return

    // Clear previous route layers
    if (markersRef.current.routeLine) {
      if (Array.isArray(markersRef.current.routeLine)) {
        markersRef.current.routeLine.forEach((l: any) => { try { l.remove() } catch (_) {} })
      } else {
        try { markersRef.current.routeLine.remove() } catch (_) {}
      }
    }
    markersRef.current.routeLine = null
    if (!simResult) return

    let cancelled = false

    const drawRoadRoute = async () => {
      const segA: [number, number] = [simResult.ambulance_lat, simResult.ambulance_lng]
      const scene: [number, number] = [simResult.accident_lat,  simResult.accident_lng]
      const segB: [number, number] = [simResult.hospital_lat,  simResult.hospital_lng]

      // Fetch both road segments in parallel
      const [routeDispatch, routeTransport] = await Promise.all([
        fetchRoadRoute(segA,  scene),
        fetchRoadRoute(scene, segB),
      ])

      if (cancelled || !mapInstanceRef.current || !window.L) return
      const L   = window.L
      const map = mapInstanceRef.current
      map.invalidateSize(false)

      requestAnimationFrame(() => {
        if (!mapInstanceRef.current) return
        const layers: any[] = []

        // ── Dispatch leg: ambulance → scene (blue, solid) ──────────────────
        const dispatchLine = L.polyline(routeDispatch.coords, {
          color: "#3b82f6", weight: 4, opacity: 0.9,
        })
        if (safeAdd(dispatchLine, map)) layers.push(dispatchLine)

        // ── Transport leg: scene → hospital (purple, dashed) ───────────────
        const transportLine = L.polyline(routeTransport.coords, {
          color: "#8b5cf6", weight: 4, opacity: 0.9, dashArray: "10 5",
        })
        if (safeAdd(transportLine, map)) layers.push(transportLine)

        // Fit map to show the full route
        if (layers.length) {
          const group = L.featureGroup(layers)
          try { map.fitBounds(group.getBounds(), { padding: [60, 60] }) } catch (_) {}
        }

        markersRef.current.routeLine = layers

        // Optional: show road distances as popups
        if (routeDispatch.distanceKm > 0) {
          const mid = routeDispatch.coords[Math.floor(routeDispatch.coords.length / 2)]
          L.popup({ className: "route-popup" })
            .setLatLng(mid)
            .setContent(`<div style="font-family:sans-serif;font-size:11px;color:#3b82f6"><b>🚑 Dispatch</b><br/>${routeDispatch.distanceKm} km · ${routeDispatch.durationMin} min</div>`)
            .openOn(map)
        }
      })
    }

    drawRoadRoute()
    return () => { cancelled = true }
  }, [simResult])

  // ── Ambulance markers ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!mapReadyRef.current || !map || !window.L) return
    const L = window.L

    Object.values(markersRef.current.ambulances).forEach((m: any) => { try { m.remove() } catch (_) {} })
    markersRef.current.ambulances = {}

    ambulances.forEach((amb) => {
      if (!amb.current_lat || !amb.current_lon) return
      const sColor = amb.status === "AVAILABLE" ? "#10b981" : amb.status === "DISPATCHED" ? "#f59e0b" : "#ef4444"
      const isActive = simResult?.nearest_ambulance === amb.registration_no
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${isActive ? "rgba(59,130,246,0.25)" : "rgba(15,20,30,0.85)"};border:${isActive ? "3px solid #3b82f6" : `2.5px solid ${sColor}`};border-radius:50%;width:${isActive ? "34px" : "28px"};height:${isActive ? "34px" : "28px"};display:flex;align-items:center;justify-content:center;font-size:${isActive ? "18px" : "14px"};box-shadow:0 4px 10px rgba(0,0,0,0.5);">🚑</div>`,
        iconSize: isActive ? [34, 34] : [28, 28], iconAnchor: isActive ? [17, 17] : [14, 14], popupAnchor: [0, -14],
      })
      const m = L.marker([amb.current_lat, amb.current_lon], { icon, zIndexOffset: 500 })
      if (safeAdd(m, map)) {
        m.bindPopup(`<div style="font-family:sans-serif;padding:4px;min-width:130px"><b style="color:#3b82f6">🚑 ${amb.registration_no}</b><br/><span style="font-size:11px;color:#888">Status: <b style="color:${sColor}">${amb.status}</b><br/>District: ${amb.district}</span></div>`)
        markersRef.current.ambulances[amb.id] = m
      }
    })
  }, [ambulances, simResult])

  // ── Hospital markers ───────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!mapReadyRef.current || !map || !window.L) return
    const L = window.L

    markersRef.current.hospitals.forEach((m: any) => { try { m.remove() } catch (_) {} })
    markersRef.current.hospitals = []

    hospitals.forEach((hosp) => {
      const isSelected = simResult?.hospital_selected === hosp.name
      const color = isSelected ? "#8b5cf6" : "#6366f1"
      const sz = isSelected ? 30 : 24
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:rgba(15,20,30,0.85);border:${isSelected ? "3px" : "2px"} solid ${color};border-radius:6px;width:${sz}px;height:${sz}px;display:flex;align-items:center;justify-content:center;font-size:${isSelected ? "16px" : "12px"};font-weight:800;color:${color};box-shadow:0 3px 10px rgba(0,0,0,0.4);">+</div>`,
        iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2], popupAnchor: [0, -sz / 2],
      })
      const m = L.marker([hosp.latitude, hosp.longitude], { icon, zIndexOffset: 300 })
      if (safeAdd(m, map)) {
        m.bindPopup(`<div style="font-family:sans-serif;padding:4px;min-width:150px"><b style="color:#8b5cf6">🏥 ${hosp.name}</b><br/><span style="font-size:11px;color:#888">Level: ${hosp.trauma_level?.replace("_", " ") ?? "—"}<br/>${hosp.is_government ? "🏛 Government" : "🏥 Private"}</span></div>`)
        markersRef.current.hospitals.push(m)
      }
    })
  }, [hospitals, simResult])

  // ── Blackspot markers ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!mapReadyRef.current || !map || !window.L) return
    const L = window.L

    markersRef.current.blackspots.forEach((m: any) => { try { m.remove() } catch (_) {} })
    markersRef.current.blackspots = []

    blackspots.forEach((bs) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:rgba(239,68,68,0.15);border:2px solid #ef4444;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;box-shadow:0 2px 6px rgba(0,0,0,0.4);">⚠</div>`,
        iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10],
      })
      const m = L.marker([bs.latitude, bs.longitude], { icon, zIndexOffset: 100 })
      if (safeAdd(m, map)) {
        m.bindPopup(`<div style="font-family:sans-serif;padding:4px"><b style="color:#ef4444">⚠️ ${bs.name}</b>${bs.risk_score ? `<br/><span style="font-size:11px;color:#888">Risk: ${bs.risk_score}</span>` : ""}</div>`)
        markersRef.current.blackspots.push(m)
      }
    })
  }, [blackspots])

  // ── Coverage circles ───────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!mapReadyRef.current || !map || !window.L) return

    markersRef.current.coverageCircles.forEach((c: any) => { try { c.remove() } catch (_) {} })
    markersRef.current.coverageCircles = []
    if (!showCoverageZones || ambulances.length === 0) return

    return drawDeferred(() => {
      ambulances.forEach((amb) => {
        if (!amb.current_lat || !amb.current_lon) return
        const latlng: [number, number] = [amb.current_lat, amb.current_lon]
        const m = mapInstanceRef.current
        if (!m) return
        const L = window.L
        const c15 = L.circle(latlng, { radius: radiusKm(15), color: "#10b981", fillColor: "#10b981", fillOpacity: 0.06, weight: 1.5, dashArray: "4 4" })
        const c30 = L.circle(latlng, { radius: radiusKm(30), color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 0.04, weight: 1.5, dashArray: "4 4" })
        const c45 = L.circle(latlng, { radius: radiusKm(45), color: "#f97316", fillColor: "#f97316", fillOpacity: 0.03, weight: 1.5, dashArray: "4 4" })
        if (safeAdd(c15, m)) markersRef.current.coverageCircles.push(c15)
        if (safeAdd(c30, m)) markersRef.current.coverageCircles.push(c30)
        if (safeAdd(c45, m)) markersRef.current.coverageCircles.push(c45)
      })
    })
  }, [showCoverageZones, ambulances])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={mapRef}
      style={{
        // Use position:absolute to fill the .mapWrapper completely
        // so the container always has definite pixel dimensions.
        position: "absolute",
        inset: 0,
        background: "#0f1419",
      }}
    />
  )
}
