export function IncidentMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  return (
    <div style={{ height: 200, background: "#0a0f1e", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #1f2937" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>📍</div>
        <div style={{ fontSize: 13, color: "#f1f5f9" }}>{latitude?.toFixed(4)}, {longitude?.toFixed(4)}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Incident location</div>
      </div>
    </div>
  )
}
