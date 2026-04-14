import React, { useEffect, useState } from "react"
import { useDistrictStore } from "../../store/districtStore"
import { blackspotsApi } from "../../api/index"
import toast from "react-hot-toast"

/* ── Priority helpers ────────────────────────────────────────────────────── */
const PRIORITY_ORDER: Record<string, number> = {
  "1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5,
}

const PRIORITY_META: Record<string, { emoji: string; color: string; label: string }> = {
  "1st": { emoji: "🔴", color: "#ef4444", label: "Critical" },
  "2nd": { emoji: "🟠", color: "#f97316", label: "High" },
  "3rd": { emoji: "🟡", color: "#eab308", label: "Moderate" },
  "4th": { emoji: "🟢", color: "#84cc16", label: "Low" },
  "5th": { emoji: "🔵", color: "#60a5fa", label: "Minimal" },
}

/* ── Road-type badge colours ─────────────────────────────────────────────── */
const ROAD_TYPE_BADGE: Record<string, { bg: string; color: string }> = {
  NH: { bg: "rgba(30,58,95,0.8)",  color: "#60a5fa" },
  SH: { bg: "rgba(26,61,43,0.8)",  color: "#4ade80" },
  OR: { bg: "rgba(61,42,10,0.8)", color: "#fbbf24" },
}

/* ── Severity badge class ────────────────────────────────────────────────── */
const sevColor = (sev: string) => {
  if (sev === "HIGH")   return "badge-critical"
  if (sev === "MEDIUM") return "badge-warning"
  return "badge-success"
}

/* ── Coord formatter ─────────────────────────────────────────────────────── */
const fmtCoord = (v?: number | null) =>
  v != null ? v.toFixed(5) : "—"

/* ═══════════════════════════════════════════════════════════════════════════ */

export function BlackSpotPage() {
  const { selectedDistrict } = useDistrictStore()
  const [spots, setSpots]               = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState("ALL")          // severity
  const [searchText, setSearchText]     = useState("")
  const [districtFilter, setDistrictFilter] = useState("ALL")
  const [roadTypeFilter, setRoadTypeFilter]  = useState("ALL")
  const [expandedId, setExpandedId]     = useState<string | null>(null)

  useEffect(() => {
    blackspotsApi.getAll({ district: selectedDistrict || undefined }).then(r => {
      const data = Array.isArray(r.data) ? r.data : []
      data.sort((a: any, b: any) =>
        (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
      )
      setSpots(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [selectedDistrict])

  /* ── Derived filter lists ──────────────────────────────────────────────── */
  const districts  = ["ALL", ...Array.from(new Set(spots.map((s: any) => s.district))).sort()]
  const roadTypes  = ["ALL", "NH", "SH", "OR"]

  const filtered = spots.filter((s: any) => {
    const matchesSev      = filter         === "ALL" || s.severity    === filter
    const matchesDist     = districtFilter === "ALL" || s.district    === districtFilter
    const matchesRoadType = roadTypeFilter === "ALL" || s.road_type   === roadTypeFilter
    const matchesSearch   = !searchText || [
      s.district, s.location, s.police_station, s.road_name, s.road_number, s.priority,
    ].some(f => f?.toLowerCase().includes(searchText.toLowerCase()))
    return matchesSev && matchesDist && matchesRoadType && matchesSearch
  })

  /* ── KPI stats ─────────────────────────────────────────────────────────── */
  const stats = {
    total:         spots.length,
    firstPriority: spots.filter(s => s.priority === "1st").length,
    highSeverity:  spots.filter(s => s.severity  === "HIGH").length,
    districts:     new Set(spots.map(s => s.district)).size,
    nhCount:       spots.filter(s => s.road_type  === "NH").length,
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>
            🚨 Black Spot Management
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 13, margin: "4px 0 0" }}>
            Kerala Police · Official accident-prone road segments · {spots.length} locations tracked
          </p>
        </div>
        <button
          onClick={() => toast("Add Black Spot form coming soon")}
          className="btn btn-primary"
        >
          + Add Black Spot
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Black Spots",    value: stats.total,          color: "var(--color-text-primary)",  icon: "📍" },
          { label: "1st Priority (Critical)", value: stats.firstPriority, color: "#ef4444",               icon: "🔴" },
          { label: "High Severity",        value: stats.highSeverity,   color: "#f97316",                   icon: "⚠️" },
          { label: "Districts Covered",    value: stats.districts,      color: "var(--color-accent-cyan)",   icon: "🗺️" },
          { label: "On National Highways", value: stats.nhCount,        color: "#60a5fa",                   icon: "🛣️" },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              {c.label}
            </div>
            <div className="mono" style={{ fontSize: 30, fontWeight: 800, color: c.color, margin: "4px 0 0", lineHeight: 1.1 }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center",
        padding: "12px 16px", borderRadius: 10,
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border-subtle)",
      }}>

        {/* Severity pills */}
        <div style={{ display: "flex", gap: 6 }}>
          {["ALL", "HIGH", "MEDIUM", "LOW"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="btn"
              style={{
                padding: "5px 13px",
                background: filter === s ? "var(--color-accent-blue)" : "transparent",
                border: filter === s ? "1px solid var(--color-accent-blue)" : "1px solid var(--color-border-strong)",
                color: filter === s ? "#fff" : "var(--color-text-secondary)",
                borderRadius: 99, fontSize: 12, transition: "all .15s",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: "var(--color-border-strong)" }} />

        {/* Road-type pills */}
        {roadTypes.map(rt => (
          <button
            key={rt}
            onClick={() => setRoadTypeFilter(rt)}
            className="btn"
            style={{
              padding: "5px 12px",
              background: roadTypeFilter === rt
                ? (ROAD_TYPE_BADGE[rt]?.bg ?? "var(--color-accent-blue)")
                : "transparent",
              border: roadTypeFilter === rt
                ? `1px solid ${ROAD_TYPE_BADGE[rt]?.color ?? "var(--color-accent-blue)"}`
                : "1px solid var(--color-border-strong)",
              color: roadTypeFilter === rt
                ? (ROAD_TYPE_BADGE[rt]?.color ?? "#fff")
                : "var(--color-text-secondary)",
              borderRadius: 99, fontSize: 12, fontWeight: 700, transition: "all .15s",
            }}
          >
            {rt}
          </button>
        ))}

        <div style={{ width: 1, height: 24, background: "var(--color-border-strong)" }} />

        {/* District select */}
        <select
          value={districtFilter}
          onChange={e => setDistrictFilter(e.target.value)}
          style={{
            padding: "6px 12px",
            background: "var(--color-bg-tertiary)",
            border: "1px solid var(--color-border-strong)",
            color: "var(--color-text-primary)",
            borderRadius: 6, fontSize: 12,
          }}
        >
          {districts.map(d => <option key={d} value={d}>{d === "ALL" ? "All Districts" : d}</option>)}
        </select>

        {/* Search */}
        <input
          type="text"
          placeholder="Search location, road, station, district…"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{
            padding: "6px 12px",
            background: "var(--color-bg-tertiary)",
            border: "1px solid var(--color-border-strong)",
            color: "var(--color-text-primary)",
            borderRadius: 6, fontSize: 12, minWidth: 240,
          }}
        />

        <span style={{ marginLeft: "auto", color: "var(--color-text-muted)", fontSize: 12 }}>
          {filtered.length} of {spots.length} records
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--color-text-muted)" }}>
            <div className="spinner" style={{ marginBottom: 16, borderColor: "var(--color-text-muted)", borderTopColor: "var(--color-accent-blue)", width: 32, height: 32, margin: "0 auto 16px" }} />
            <div>Loading Black Spots…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--color-text-muted)" }}>
            No black spots match the current filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ width: 52 }}>#</th>
                  <th>Priority</th>
                  <th>District</th>
                  <th>Police Station</th>
                  <th style={{ minWidth: 200 }}>Location / Stretch</th>
                  <th>Road No.</th>
                  <th style={{ minWidth: 180 }}>Road Name</th>
                  <th>Type</th>
                  <th>Length</th>
                  <th>Midpoint (Lat/Lon)</th>
                  <th>Severity</th>
                  <th>Risk</th>
                  <th style={{ width: 60 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any, i: number) => {
                  const roadMeta = ROAD_TYPE_BADGE[s.road_type] ?? { bg: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }
                  const priMeta  = PRIORITY_META[s.priority]   ?? { emoji: "⚪", color: "var(--color-text-muted)", label: "—" }
                  const isExpanded = expandedId === s.id

                  return (
                    <React.Fragment key={s.id}>
                      <tr
                        style={{ cursor: "pointer", transition: "background .1s" }}
                        onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      >
                        {/* Index */}
                        <td className="mono" style={{ color: "var(--color-text-muted)", fontSize: 11 }}>
                          BS-{String(i + 1).padStart(3, "0")}
                        </td>

                        {/* Priority */}
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, color: priMeta.color }}>
                            <span style={{ fontSize: 13 }}>{priMeta.emoji}</span>
                            <span>{s.priority}</span>
                            <span style={{ fontSize: 10, opacity: 0.7 }}>({priMeta.label})</span>
                          </span>
                        </td>

                        {/* District */}
                        <td style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                          {s.district}
                        </td>

                        {/* Police Station */}
                        <td style={{ color: "var(--color-text-secondary)" }}>
                          {s.police_station || "—"}
                        </td>

                        {/* Location */}
                        <td style={{ color: "var(--color-text-primary)", maxWidth: 220 }}>
                          <div style={{ fontWeight: 500, lineHeight: 1.3 }}>{s.location || "—"}</div>
                        </td>

                        {/* Road Number */}
                        <td>
                          <span className="mono" style={{ fontWeight: 700, color: roadMeta.color, fontSize: 11 }}>
                            {s.road_number || "—"}
                          </span>
                        </td>

                        {/* Road Name */}
                        <td style={{ color: "var(--color-text-muted)", maxWidth: 200 }}>
                          <div style={{ lineHeight: 1.3 }}>{s.road_name || "—"}</div>
                        </td>

                        {/* Road Type badge */}
                        <td>
                          {s.road_type ? (
                            <span style={{
                              padding: "2px 8px", borderRadius: 4,
                              background: roadMeta.bg, color: roadMeta.color,
                              fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)",
                            }}>
                              {s.road_type}
                            </span>
                          ) : "—"}
                        </td>

                        {/* Length */}
                        <td className="mono" style={{ color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                          {s.road_length || "—"}
                        </td>

                        {/* Midpoint coordinates */}
                        <td className="mono" style={{ color: "var(--color-text-muted)", fontSize: 11 }}>
                          <div>{fmtCoord(s.latitude)}° N</div>
                          <div>{fmtCoord(s.longitude)}° E</div>
                        </td>

                        {/* Severity */}
                        <td>
                          {s.severity ? (
                            <span className={`badge ${sevColor(s.severity)}`}>{s.severity}</span>
                          ) : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                        </td>

                        {/* Risk score */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{
                              width: 36, height: 5, borderRadius: 3,
                              background: "var(--color-bg-tertiary)", overflow: "hidden",
                            }}>
                              <div style={{
                                width: `${(s.risk_score / 10) * 100}%`, height: "100%",
                                background: s.risk_score >= 8 ? "#ef4444" : s.risk_score >= 5 ? "#f97316" : "#4ade80",
                                borderRadius: 3,
                              }} />
                            </div>
                            <span className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                              {s.risk_score?.toFixed(1)}
                            </span>
                          </div>
                        </td>

                        {/* Expand toggle */}
                        <td style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: 16 }}>
                          {isExpanded ? "▲" : "▼"}
                        </td>
                      </tr>

                      {/* Expanded segment detail row */}
                      {isExpanded && (
                        <tr key={`${s.id}-detail`}>
                          <td colSpan={13} style={{ padding: 0 }}>
                            <div style={{
                              margin: "0 12px 12px",
                              padding: "14px 18px",
                              borderRadius: 8,
                              background: "var(--color-bg-secondary)",
                              border: "1px solid var(--color-border-subtle)",
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                              gap: "12px 24px",
                            }}>
                              <DetailField label="Starting Point" value={
                                s.start_latitude != null
                                  ? `${fmtCoord(s.start_latitude)}° N, ${fmtCoord(s.start_longitude)}° E`
                                  : "—"
                              } mono />
                              <DetailField label="Ending Point" value={
                                s.end_latitude != null
                                  ? `${fmtCoord(s.end_latitude)}° N, ${fmtCoord(s.end_longitude)}° E`
                                  : "—"
                              } mono />
                              <DetailField label="Midpoint (Heatmap Pin)"  value={`${fmtCoord(s.latitude)}° N, ${fmtCoord(s.longitude)}° E`} mono />
                              <DetailField label="Road Number"  value={s.road_number  || "—"} />
                              <DetailField label="Road Type"    value={s.road_type    || "—"} />
                              <DetailField label="Road Length"  value={s.road_length  || "—"} />
                              <DetailField label="Incident Count"    value={String(s.incident_count ?? 0)} />
                              <DetailField label="Accidents / Year"  value={String(s.accidents_per_year ?? 0)} />
                              <DetailField label="Fatality Rate"     value={s.fatality_rate != null ? `${s.fatality_rate}%` : "N/A"} />
                              {s.description && (
                                <div style={{ gridColumn: "1 / -1" }}>
                                  <div style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4 }}>Description</div>
                                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{s.description}</div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div style={{
        marginTop: 16, display: "flex", gap: 24, flexWrap: "wrap",
        padding: "10px 16px", borderRadius: 8,
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border-subtle)",
        fontSize: 11, color: "var(--color-text-muted)",
      }}>
        <span style={{ fontWeight: 700, color: "var(--color-text-secondary)" }}>Legend:</span>
        {Object.entries(PRIORITY_META).map(([k, v]) => (
          <span key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {v.emoji} <b style={{ color: v.color }}>{k}</b> — {v.label}
          </span>
        ))}
        <span style={{ marginLeft: "auto" }}>Click any row to expand segment coordinates</span>
      </div>
    </div>
  )
}

/* ── Small helper component ──────────────────────────────────────────────── */
function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: "var(--color-text-primary)", fontFamily: mono ? "var(--font-mono)" : undefined }}>
        {value}
      </div>
    </div>
  )
}
