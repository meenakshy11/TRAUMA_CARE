import React, { useEffect, useState } from "react"
import { ambulanceBasesApi } from "../../api/index"

/* ── Type badge metadata ─────────────────────────────────────────────────── */
const TYPE_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  hospital: { label: "Hospital",     icon: "🏥", color: "#22c55e", bg: "rgba(34,197,94,0.12)"  },
  police:   { label: "Police",       icon: "🚔", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  fire:     { label: "Fire Station", icon: "🚒", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
}

const fmt = (v: number) => v.toFixed(5)

/* ─────────────────────────────────────────────────────────────────────────── */
export function AmbulanceBasesPage() {
  const [bases, setBases]           = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [search, setSearch]         = useState("")
  const [expanded, setExpanded]     = useState<string | null>(null)

  useEffect(() => {
    ambulanceBasesApi.getAll()
      .then(r => { setBases(Array.isArray(r.data) ? r.data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  /* ── Filtered list ──────────────────────────────────────────────────────── */
  const filtered = bases.filter(b => {
    const matchType   = typeFilter === "ALL" || b.base_type === typeFilter
    const matchSearch = !search || [b.base_name, b.base_address, b.base_id]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()))
    return matchType && matchSearch
  })

  /* ── Stats ──────────────────────────────────────────────────────────────── */
  const stats = {
    total:     bases.length,
    hospitals: bases.filter(b => b.base_type === "hospital").length,
    police:    bases.filter(b => b.base_type === "police").length,
    fire:      bases.filter(b => b.base_type === "fire").length,
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26 }}>🚑</span> Base Stations
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 13 }}>
          Kerala · Ambulance deployment bases — hospitals, police, and fire stations · {bases.length} locations registered
        </p>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Bases",     value: stats.total,     color: "var(--color-text-primary)",  icon: "📍" },
          { label: "Hospitals",       value: stats.hospitals,  color: "#22c55e",                    icon: "🏥" },
          { label: "Police Stations", value: stats.police,     color: "#60a5fa",                    icon: "🚔" },
          { label: "Fire Stations",   value: stats.fire,       color: "#f97316",                    icon: "🚒" },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: "18px 22px" }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase" }}>
              {c.label}
            </div>
            <div className="mono" style={{ fontSize: 32, fontWeight: 800, color: c.color, marginTop: 4, lineHeight: 1.1 }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center",
        padding: "12px 16px", borderRadius: 10,
        background: "var(--color-bg-secondary)", border: "1px solid var(--color-border-subtle)",
      }}>
        {/* Type pills */}
        {["ALL", "hospital", "police", "fire"].map(t => {
          const meta = TYPE_META[t]
          const isActive = typeFilter === t
          return (
            <button key={t} onClick={() => setTypeFilter(t)} className="btn" style={{
              padding: "5px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
              transition: "all .15s",
              background: isActive ? (meta?.bg ?? "var(--color-accent-blue)") : "transparent",
              color: isActive ? (meta?.color ?? "#fff") : "var(--color-text-secondary)",
              border: isActive
                ? `1px solid ${meta?.color ?? "var(--color-accent-blue)"}`
                : "1px solid var(--color-border-strong)",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              {meta ? `${meta.icon} ${meta.label}` : "All Types"}
            </button>
          )
        })}

        <div style={{ width: 1, height: 24, background: "var(--color-border-strong)" }} />

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name, address, or base ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: "6px 12px", borderRadius: 6, fontSize: 12,
            background: "var(--color-bg-tertiary)",
            border: "1px solid var(--color-border-strong)",
            color: "var(--color-text-primary)", minWidth: 260,
          }}
        />

        <span style={{ marginLeft: "auto", color: "var(--color-text-muted)", fontSize: 12 }}>
          {filtered.length} of {bases.length} stations
        </span>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--color-text-muted)" }}>
            <div className="spinner" style={{ borderColor: "var(--color-text-muted)", borderTopColor: "var(--color-accent-blue)", width: 32, height: 32, margin: "0 auto 16px" }} />
            <div>Loading Base Stations…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--color-text-muted)" }}>
            No stations match the current filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ width: 52 }}>#</th>
                  <th>Base ID</th>
                  <th>Type</th>
                  <th style={{ minWidth: 280 }}>Station Name</th>
                  <th style={{ minWidth: 320 }}>Address</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th style={{ width: 60 }}>Map</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b: any, i: number) => {
                  const meta = TYPE_META[b.base_type] ?? { label: b.base_type, icon: "📍", color: "var(--color-text-secondary)", bg: "var(--color-bg-tertiary)" }
                  const isExp = expanded === b.id

                  return (
                    <React.Fragment key={b.id}>
                      <tr
                        style={{ cursor: "pointer", borderLeft: `3px solid ${meta.color}`, transition: "background .1s" }}
                        onClick={() => setExpanded(isExp ? null : b.id)}
                      >
                        {/* Index */}
                        <td className="mono" style={{ color: "var(--color-text-muted)", fontSize: 11 }}>
                          {String(i + 1).padStart(3, "0")}
                        </td>

                        {/* Base ID */}
                        <td>
                          <span className="mono" style={{ fontWeight: 700, color: meta.color, fontSize: 11 }}>
                            {b.base_id}
                          </span>
                        </td>

                        {/* Type badge */}
                        <td>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                            background: meta.bg, color: meta.color,
                          }}>
                            <span>{meta.icon}</span>
                            <span>{meta.label}</span>
                          </span>
                        </td>

                        {/* Name */}
                        <td style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                          {b.base_name}
                        </td>

                        {/* Address */}
                        <td style={{ color: "var(--color-text-secondary)", maxWidth: 320 }}>
                          <div style={{ lineHeight: 1.35 }}>{b.base_address || "—"}</div>
                        </td>

                        {/* Lat */}
                        <td className="mono" style={{ color: "var(--color-text-muted)", fontSize: 11 }}>
                          {fmt(b.base_lat)}° N
                        </td>

                        {/* Lon */}
                        <td className="mono" style={{ color: "var(--color-text-muted)", fontSize: 11 }}>
                          {fmt(b.base_lon)}° E
                        </td>

                        {/* Map link */}
                        <td style={{ textAlign: "center" }}>
                          <a
                            href={`https://www.google.com/maps?q=${b.base_lat},${b.base_lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            title="Open in Google Maps"
                            style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 28, height: 28, borderRadius: 6,
                              background: "rgba(96,165,250,0.12)", color: "#60a5fa",
                              textDecoration: "none", fontSize: 14, transition: "background .15s",
                            }}
                          >
                            🗺
                          </a>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExp && (
                        <tr key={`${b.id}-detail`}>
                          <td colSpan={8} style={{ padding: 0 }}>
                            <div style={{
                              margin: "0 12px 12px",
                              padding: "16px 20px",
                              borderRadius: 8,
                              background: "var(--color-bg-secondary)",
                              border: "1px solid var(--color-border-subtle)",
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                              gap: "14px 24px",
                            }}>
                              <InfoField label="Base ID"         value={b.base_id} mono />
                              <InfoField label="Station Type"    value={`${meta.icon} ${meta.label}`} />
                              <InfoField label="Latitude"        value={`${fmt(b.base_lat)}° N`} mono />
                              <InfoField label="Longitude"       value={`${fmt(b.base_lon)}° E`} mono />
                              <InfoField label="Full Address"    value={b.base_address || "—"} />
                              <div style={{ gridColumn: "1 / -1" }}>
                                <div style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>Location Preview</div>
                                <a
                                  href={`https://www.google.com/maps?q=${b.base_lat},${b.base_lon}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                    padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                                    background: "rgba(96,165,250,0.12)", color: "#60a5fa",
                                    textDecoration: "none", border: "1px solid rgba(96,165,250,0.25)",
                                  }}
                                >
                                  🗺 Open in Google Maps · {fmt(b.base_lat)}, {fmt(b.base_lon)}
                                </a>
                              </div>
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

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div style={{
        marginTop: 16, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center",
        padding: "10px 16px", borderRadius: 8,
        background: "var(--color-bg-secondary)", border: "1px solid var(--color-border-subtle)",
        fontSize: 11, color: "var(--color-text-muted)",
      }}>
        <span style={{ fontWeight: 700, color: "var(--color-text-secondary)" }}>Legend:</span>
        {Object.entries(TYPE_META).map(([k, v]) => (
          <span key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ color: v.color, fontWeight: 700 }}>{v.icon} {v.label}</span>
          </span>
        ))}
        <span style={{ marginLeft: "auto" }}>Click any row to expand coordinates · left border colour = station type</span>
      </div>
    </div>
  )
}

/* ── Small helper ────────────────────────────────────────────────────────── */
function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
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
