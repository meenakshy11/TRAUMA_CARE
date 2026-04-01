import { useFilteredHospitals } from "../../../store/hospitalStore"

export function HospitalPanel() {
  // useFilteredHospitals() subscribes to BOTH hospitals + filters state
  // so this component correctly re-renders when either changes
  const list = useFilteredHospitals()

  if (list.length === 0) {
    return (
      <div style={{
        color: "var(--color-text-muted)", fontSize: "13px",
        textAlign: "center", padding: "32px 0",
      }}>
        No hospitals match the current filters
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {list.map((h: any) => {
        const icuAvail  = h.resources?.icu_beds_available ?? 0
        const icuTotal  = h.resources?.icu_beds_total     ?? 0
        const isIcuFull = icuTotal > 0 && icuAvail === 0
        const hasBB     = h.resources?.blood_bank_available ?? false

        return (
          <div key={h.id} className="card" style={{ padding: 14 }}>
            {/* Header row */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "flex-start", marginBottom: 6,
            }}>
              <div>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: "var(--color-text-primary)", marginBottom: 2,
                }}>
                  {h.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                  {h.trauma_level?.replace(/_/g, " ")} · {h.district}
                  {h.is_government && (
                    <span style={{ marginLeft: 6, color: "var(--color-accent-cyan)" }}>
                      🏛 Govt
                    </span>
                  )}
                  {hasBB && (
                    <span style={{ marginLeft: 6, color: "#e74c3c" }}>
                      🩸 BB
                    </span>
                  )}
                </div>
              </div>
              <span className={`badge ${isIcuFull ? "badge-danger" : "badge-success"}`}>
                {isIcuFull ? "FULL" : "OPEN"}
              </span>
            </div>

            {/* Resource grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "8px", marginTop: "12px",
            }}>
              <div style={{
                background: "var(--color-bg-tertiary)", padding: "6px 8px",
                borderRadius: "var(--radius-sm)",
                display: "flex", flexDirection: "column", gap: "2px",
              }}>
                <span style={{
                  fontSize: "10px", color: "var(--color-text-secondary)",
                  fontWeight: 600, textTransform: "uppercase",
                }}>
                  ICU Beds
                </span>
                <span style={{
                  fontSize: "14px", fontWeight: 700,
                  color: isIcuFull ? "var(--color-danger)" : "var(--color-success)",
                  fontFamily: "var(--font-mono)",
                }}>
                  {icuAvail} / {icuTotal}
                </span>
              </div>

              <div style={{
                background: "var(--color-bg-tertiary)", padding: "6px 8px",
                borderRadius: "var(--radius-sm)",
                display: "flex", flexDirection: "column", gap: "2px",
              }}>
                <span style={{
                  fontSize: "10px", color: "var(--color-text-secondary)",
                  fontWeight: 600, textTransform: "uppercase",
                }}>
                  OT Status
                </span>
                <span style={{
                  fontSize: "14px", fontWeight: 700,
                  color: h.resources?.ot_available
                    ? "var(--color-success)" : "var(--color-warning)",
                  fontFamily: "var(--font-mono)",
                }}>
                  {h.resources?.ot_available ? "Ready" : "Busy"}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}