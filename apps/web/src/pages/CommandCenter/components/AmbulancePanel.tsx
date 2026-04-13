import { useState } from "react"
import { useAmbulanceStore } from "../../../store/ambulanceStore"

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE:    "var(--color-success)",
  ON_TRIP:      "var(--color-warning)",
  DISPATCHED:   "var(--color-warning)",
  ON_SCENE:     "var(--color-danger)",
  TRANSPORTING: "var(--color-danger)",
  AT_HOSPITAL:  "var(--color-accent-blue)",
  MAINTENANCE:  "var(--color-text-muted)",
  OFF_DUTY:     "var(--color-text-muted)",
}

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  ALS:  { label: "ALS",  color: "#e74c3c" },
  BLS:  { label: "BLS",  color: "#3498db" },
  NICU: { label: "NICU", color: "#9b59b6" },
  MFR:  { label: "MFR",  color: "#e67e22" },
}

export function AmbulancePanel() {
  const ambulances = useAmbulanceStore((s) => s.ambulances)
  const positions  = useAmbulanceStore((s) => s.positions)
  const [filter, setFilter] = useState<string>("ALL")
  const [search, setSearch] = useState<string>("")

  const allAmbs = Object.values(ambulances)
  const districts = Array.from(new Set(allAmbs.map((a: any) => a.district))).sort()

  // Summary counts
  const available   = allAmbs.filter((a: any) => a.status === "AVAILABLE").length
  const onTrip      = allAmbs.filter((a: any) => a.status === "ON_TRIP" || a.status === "DISPATCHED").length
  const maintenance = allAmbs.filter((a: any) => a.status === "MAINTENANCE").length

  const filtered = allAmbs
    .filter((a: any) => filter === "ALL" || a.district === filter)
    .filter((a: any) =>
      !search ||
      a.registration_no?.toLowerCase().includes(search.toLowerCase()) ||
      a.district?.toLowerCase().includes(search.toLowerCase())
    )

  if (allAmbs.length === 0) {
    return (
      <div style={{ color: "var(--color-text-muted)", fontSize: "13px", textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>🚑</div>
        No ambulances broadcasting position
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Summary strip */}
      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
        {[
          { label: "Available", val: available, color: "var(--color-success)" },
          { label: "On Trip",   val: onTrip,    color: "var(--color-warning)" },
          { label: "Maint.",    val: maintenance,color: "var(--color-text-muted)" },
        ].map((s) => (
          <div key={s.label} style={{
            flex: 1, background: "var(--color-bg-tertiary)", borderRadius: "var(--radius-sm)",
            padding: "6px 8px", textAlign: "center",
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: "var(--font-mono)" }}>{s.val}</div>
            <div style={{ fontSize: 9, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search registration / district…"
        style={{
          width: "100%", boxSizing: "border-box",
          background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)", padding: "7px 10px",
          color: "var(--color-text-primary)", fontSize: 12, outline: "none",
        }}
      />

      {/* District filter */}
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{
          background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)", padding: "6px 8px",
          color: "var(--color-text-primary)", fontSize: 12, cursor: "pointer",
        }}
      >
        <option value="ALL">All Districts ({allAmbs.length})</option>
        {districts.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* List */}
      {filtered.map((amb: any) => {
        const pos  = positions[amb.id]
        const statusColor = STATUS_COLOR[amb.status] ?? "var(--color-text-muted)"
        const typeBadge   = TYPE_BADGE[amb.ambulance_type] ?? { label: amb.ambulance_type, color: "#666" }

        return (
          <div key={amb.id} className="card" style={{ padding: 12 }}>
            {/* Row 1: registration + type + status */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 16 }}>🚑</span>
                <div>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)" }}>
                    {amb.registration_no}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-text-muted)" }}>
                    {amb.device_id ?? "—"}
                  </div>
                </div>
                <span style={{
                  background: typeBadge.color + "22", border: `1px solid ${typeBadge.color}`,
                  borderRadius: 4, fontSize: 9, fontWeight: 700, color: typeBadge.color,
                  padding: "2px 5px", letterSpacing: "0.5px",
                }}>
                  {typeBadge.label}
                </span>
              </div>
              <span style={{
                background: statusColor + "22", border: `1px solid ${statusColor}`,
                borderRadius: 4, fontSize: 9, fontWeight: 700, color: statusColor,
                padding: "2px 6px", letterSpacing: "0.3px", flexShrink: 0,
              }}>
                {amb.status?.replace(/_/g, " ")}
              </span>
            </div>

            {/* Row 2: district + speed */}
            <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
              <span style={{
                background: "var(--color-bg-tertiary)", borderRadius: 4, fontSize: 10,
                padding: "2px 7px", color: "var(--color-text-secondary)",
              }}>
                📍 {amb.district}
              </span>
              {amb.speed_kmph != null && (
                <span style={{
                  background: "var(--color-bg-tertiary)", borderRadius: 4, fontSize: 10,
                  padding: "2px 7px", color: "var(--color-accent-cyan)",
                }}>
                  ⚡ {amb.speed_kmph.toFixed(1)} km/h
                </span>
              )}
            </div>

            {/* Row 3: GPS coords */}
            {pos && (
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { label: "LAT", val: pos.lat.toFixed(4) },
                  { label: "LON", val: pos.lon.toFixed(4) },
                ].map((coord) => (
                  <div key={coord.label} style={{
                    flex: 1, background: "var(--color-bg-tertiary)",
                    borderRadius: "var(--radius-sm)", padding: "4px 7px",
                  }}>
                    <div style={{ fontSize: 9, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>{coord.label}</div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{coord.val}</div>
                  </div>
                ))}
                <div style={{
                  flex: 1, background: "var(--color-bg-tertiary)",
                  borderRadius: "var(--radius-sm)", padding: "4px 7px",
                }}>
                  <div style={{ fontSize: 9, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>UPDATED</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                    {new Date(pos.updatedAt).toLocaleTimeString("en-IN", { hour12: false })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

