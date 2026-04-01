import { useMapStore } from "../../../store/mapStore"

type LayerKey = "showAmbulances" | "showHospitals" | "showBlackSpots" | "showHeatmap" | "showIncidents"

export function MapLayerControl() {
  const mapStore = useMapStore()

  const Toggle = ({ layerKey, icon, label }: { layerKey: LayerKey; icon: string; label: string }) => {
    const active = mapStore[layerKey]
    return (
      <button
        onClick={() => mapStore.toggle(layerKey)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 12px",
          background: active ? "var(--color-bg-hover)" : "transparent",
          border: "none",
          borderLeft: active ? "3px solid var(--color-accent-blue)" : "3px solid transparent",
          color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
          fontSize: 12, fontWeight: active ? 600 : 500,
          cursor: "pointer", width: "100%",
          transition: "all var(--transition-fast)",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{icon}</span>
        {label}
      </button>
    )
  }

  return (
    <div className="card" style={{ padding: "8px 0", width: 180, overflow: "hidden" }}>
      <div style={{ padding: "4px 12px 8px", fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "1.2px", textTransform: "uppercase", borderBottom: "1px solid var(--color-border)", marginBottom: 4 }}>
        Map Layers
      </div>
      <Toggle layerKey="showAmbulances" icon="🚑" label="Ambulances" />
      <Toggle layerKey="showHospitals"  icon="🏥" label="Hospitals" />
      <Toggle layerKey="showBlackSpots" icon="⚠️" label="Black Spots" />
      <Toggle layerKey="showIncidents"  icon="🚨" label="Incidents" />
      <Toggle layerKey="showHeatmap"    icon="🔥" label="Risk Heatmap" />
    </div>
  )
}
