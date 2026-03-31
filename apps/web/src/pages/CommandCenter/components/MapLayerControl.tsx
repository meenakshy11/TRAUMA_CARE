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
    <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000, background: "#060d1aee", border: "1px solid #1f2937", borderRadius: 8, padding: "8px 10px" }}>
      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6, fontWeight: 600 }}>MAP LAYERS</div>
      {layers.map(l => (
        <div key={l.key} onClick={() => store.toggle(l.key)}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, cursor: "pointer" }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: (store as any)[l.key] ? l.color : "#374151" }} />
          <span style={{ fontSize: 11, color: (store as any)[l.key] ? "#f1f5f9" : "#64748b" }}>{l.label}</span>
        </div>
      ))}
    </div>
  )
}
