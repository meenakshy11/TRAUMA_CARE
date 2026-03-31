import { useHospitalStore } from "../../../store/hospitalStore"

export function HospitalPanel() {
  const hospitals = useHospitalStore((s) => s.hospitals)
  const list = Object.values(hospitals)

  return (
    <div>
      {list.map((h: any) => (
        <div key={h.id} style={{ padding: "10px 14px", borderBottom: "1px solid #1f2937" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#f1f5f9" }}>{h.name}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{h.district} · {h.trauma_level?.replace("_"," ")}</div>
          {h.resources && (
            <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
              <span style={{ fontSize: 10, color: h.resources.icu_beds_available > 3 ? "#10b981" : "#ef4444" }}>ICU: {h.resources.icu_beds_available}/{h.resources.icu_beds_total}</span>
              <span style={{ fontSize: 10, color: "#64748b" }}>Vent: {h.resources.ventilators_available}</span>
              <span style={{ fontSize: 10, color: h.resources.ot_available ? "#10b981" : "#ef4444" }}>OT: {h.resources.ot_available ? "✓" : "✗"}</span>
            </div>
          )}
        </div>
      ))}
      {list.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#64748b", fontSize: 13 }}>Loading hospitals...</div>}
    </div>
  )
}
