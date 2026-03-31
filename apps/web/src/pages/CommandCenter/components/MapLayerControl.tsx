import { useMapStore } from "../../../store/mapStore"

export function MapLayerControl() {
  const store = useMapStore()
  const layers = [
    { key: "showHospitals", label: "Hospitals", color: "#3b82f6" },
    { key: "showAmbulances", label: "Ambulances", color: "#10b981" },
    { key: "showBlackSpots", label: "Black Spots", color: "#ef4444" },
    { key: "showHeatmap", label: "Heatmap", color: "#f59e0b" },
    { key: "showIncidents", label: "Incidents", color: "#8b5cf6" },
  ]
  return (
    <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000, background: "rgba(255,255,255,0.95)", border: "1px solid #c8d8f0", borderRadius: 8, padding: "8px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <div style={{ fontSize: 10, color: "#6b87b0", marginBottom: 6, fontWeight: 700 }}>MAP LAYERS</div>
      {layers.map(l => (
        <div key={l.key} onClick={() => store.toggle(l.key)}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, cursor: "pointer" }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: (store as any)[l.key] ? l.color : "#d1d5db" }} />
          <span style={{ fontSize: 11, color: (store as any)[l.key] ? "#0f2952" : "#9ca3af" }}>{l.label}</span>
        </div>
      ))}
    </div>
  )
}
