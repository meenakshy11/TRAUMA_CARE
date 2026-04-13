/**
 * RoadSafetyPanel.tsx
 *
 * Road Safety Analytics Panel comprising:
 *  - Accidents by Location  (Top 10 accident-prone areas table + bar chart)
 *  - Accidents by Time      (Night / Day / Peak hours bar chart)
 *  - Accidents by Severity  (Pie chart: Critical / Severe / Moderate / Minor)
 *  - Side Panel             (Top Locations · Severity Trends · Time Patterns)
 */

import { useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid, RadarChart,
  PolarGrid, PolarAngleAxis, Radar,
} from "recharts"

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  grid:     "var(--color-border)",
  text:     "var(--color-text-muted)",
  blue:     "#3b82f6",
  cyan:     "#06b6d4",
  green:    "#10b981",
  orange:   "#f59e0b",
  red:      "#ef4444",
  critical: "#ef4444",
  severe:   "#f97316",
  moderate: "#f59e0b",
  minor:    "#22c55e",
  night:    "#6366f1",
  day:      "#f59e0b",
  peak:     "#ef4444",
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

export const TOP_ACCIDENT_LOCATIONS = [
  { rank: 1,  name: "Palarivattom Junction",      district: "Ernakulam",         lat: 9.9816,  lon: 76.2999, deaths: 14, severity: "CRITICAL", accidents: 58 },
  { rank: 2,  name: "Kalamassery Bypass",         district: "Ernakulam",         lat: 10.0536, lon: 76.3156, deaths: 11, severity: "CRITICAL", accidents: 49 },
  { rank: 3,  name: "Kaloor–Vytilla Corridor",    district: "Ernakulam",         lat: 9.9620,  lon: 76.2940, deaths: 9,  severity: "SEVERE",   accidents: 44 },
  { rank: 4,  name: "NH66 Paravur Stretch",       district: "Kollam",            lat: 9.2426,  lon: 76.5278, deaths: 13, severity: "CRITICAL", accidents: 43 },
  { rank: 5,  name: "Vadakkanchery NH544",        district: "Palakkad",          lat: 10.6049, lon: 76.5978, deaths: 10, severity: "SEVERE",   accidents: 41 },
  { rank: 6,  name: "Kozhikode Bypass NHW",       district: "Kozhikode",         lat: 11.2588, lon: 75.7804, deaths: 8,  severity: "SEVERE",   accidents: 38 },
  { rank: 7,  name: "Thrissur–Palakkad Border",   district: "Thrissur",          lat: 10.5276, lon: 76.2144, deaths: 7,  severity: "MODERATE", accidents: 35 },
  { rank: 8,  name: "Thiruvananthapuram Bypass",  district: "Thiruvananthapuram",lat: 8.5241,  lon: 76.9366, deaths: 6,  severity: "MODERATE", accidents: 32 },
  { rank: 9,  name: "Manjeri NH213",              district: "Malappuram",        lat: 11.1213, lon: 76.1221, deaths: 5,  severity: "MODERATE", accidents: 29 },
  { rank: 10, name: "Kottayam NH183",             district: "Kottayam",          lat: 9.5916,  lon: 76.5222, deaths: 4,  severity: "MINOR",    accidents: 24 },
]

const TIME_DATA = [
  { hour: "00–02", night: 18, day: 0,  peak: 2  },
  { hour: "02–04", night: 22, day: 0,  peak: 1  },
  { hour: "04–06", night: 14, day: 2,  peak: 3  },
  { hour: "06–08", night: 0,  day: 31, peak: 28 },
  { hour: "08–10", night: 0,  day: 24, peak: 9  },
  { hour: "10–12", night: 0,  day: 19, peak: 6  },
  { hour: "12–14", night: 0,  day: 22, peak: 7  },
  { hour: "14–16", night: 0,  day: 21, peak: 8  },
  { hour: "16–18", night: 0,  day: 29, peak: 26 },
  { hour: "18–20", night: 4,  day: 34, peak: 31 },
  { hour: "20–22", night: 19, day: 12, peak: 4  },
  { hour: "22–24", night: 24, day: 0,  peak: 3  },
]

const SEVERITY_DATA = [
  { name: "Critical", value: 48, color: C.critical },
  { name: "Severe",   value: 71, color: C.severe   },
  { name: "Moderate", value: 89, color: C.moderate },
  { name: "Minor",    value: 34, color: C.minor    },
]

const TREND_RADAR = [
  { axis: "Ernakulam",         A: 88 },
  { axis: "Palakkad",          A: 47 },
  { axis: "Kozhikode",         A: 64 },
  { axis: "Thrissur",          A: 72 },
  { axis: "Thiruvananthapuram",A: 79 },
  { axis: "Kollam",            A: 55 },
]

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: "var(--color-bg-tertiary)",
      border: "1px solid var(--color-border-strong)",
      borderRadius: "var(--radius-sm)",
      padding: "10px 14px",
      boxShadow: "var(--shadow-elevated)",
      minWidth: 130,
    }}>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginTop: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color ?? p.fill, flexShrink: 0 }} />
          <span style={{ color: "var(--color-text-secondary)" }}>{p.name}:</span>
          <span className="mono" style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Severity badge helper ────────────────────────────────────────────────────
const sevBadge = (s: string) => {
  const map: Record<string, string> = {
    CRITICAL: "badge-danger", SEVERE: "badge-warning",
    MODERATE: "badge-info",   MINOR:    "badge-success",
  }
  return map[s] ?? "badge-muted"
}
const sevColor = (s: string) => {
  const map: Record<string, string> = {
    CRITICAL: C.critical, SEVERE: C.severe, MODERATE: C.moderate, MINOR: C.minor,
  }
  return map[s] ?? "var(--color-text-secondary)"
}

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHead = ({ icon, title, sub }: { icon: string; title: string; sub: string }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
    <span style={{ fontSize: 20 }}>{icon}</span>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</div>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{sub}</div>
    </div>
  </div>
)

// ─── Panel Header ─────────────────────────────────────────────────────────────
const PanelHead = ({ title, sub }: { title: string; sub: string }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
    {title}
    <div style={{ fontSize: 10, fontWeight: 400, color: "var(--color-text-muted)", textTransform: "none", letterSpacing: 0, marginTop: 2 }}>{sub}</div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────
export function RoadSafetyPanel() {
  const [activeTab, setActiveTab] = useState<"location" | "time" | "severity">("location")

  const totalAccidents = SEVERITY_DATA.reduce((a, d) => a + d.value, 0)

  return (
    <div style={{ display: "flex", gap: 20 }}>

      {/* ── Main Charts Area ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Chart Switcher ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8 }}>
          {([
            { id: "location", label: "🗺️ By Location" },
            { id: "time",     label: "⏱️ By Time"     },
            { id: "severity", label: "🚨 By Severity" },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                fontSize: 12,
                fontWeight: 600,
                background: activeTab === t.id ? "var(--color-accent-blue)" : "var(--color-bg-tertiary)",
                color: activeTab === t.id ? "#fff" : "var(--color-text-secondary)",
                border: activeTab === t.id ? "none" : "1px solid var(--color-border)",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── Accidents by Location ──────────────────────────────────────── */}
        {activeTab === "location" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Bar Chart — top 10 accident volumes */}
            <div className="card" style={{ padding: 20 }}>
              <SectionHead
                icon="📍"
                title="Top 10 Accident-Prone Locations"
                sub="Accident count per location — Kerala State"
              />
              <ResponsiveContainer width="100%" height={230}>
                <BarChart
                  data={TOP_ACCIDENT_LOCATIONS}
                  layout="vertical"
                  margin={{ top: 0, right: 16, bottom: 0, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={170}
                    tick={{ fill: C.text, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="accidents" name="Accidents" radius={[0, 4, 4, 0]}
                    fill="url(#locGrad)"
                  />
                  <defs>
                    <linearGradient id="locGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.blue} stopOpacity={0.7} />
                      <stop offset="100%" stopColor={C.cyan} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detail Table */}
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{
                padding: "12px 18px",
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-bg-tertiary)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)" }}>
                  Location Detail Table
                </span>
                <span className="badge badge-danger">High Risk</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Location</th>
                      <th>District</th>
                      <th style={{ textAlign: "center" }}>Latitude</th>
                      <th style={{ textAlign: "center" }}>Longitude</th>
                      <th style={{ textAlign: "center" }}>Deaths</th>
                      <th style={{ textAlign: "center" }}>Accidents</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_ACCIDENT_LOCATIONS.map(loc => (
                      <tr key={loc.rank}>
                        <td>
                          <span className="mono" style={{
                            fontSize: 11, fontWeight: 700,
                            color: loc.rank <= 3 ? C.critical : loc.rank <= 6 ? C.severe : C.moderate,
                          }}>#{loc.rank}</span>
                        </td>
                        <td style={{ fontWeight: 600, color: "var(--color-text-primary)", maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {loc.name}
                        </td>
                        <td style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>{loc.district}</td>
                        <td className="mono" style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-secondary)" }}>
                          {loc.lat.toFixed(4)}
                        </td>
                        <td className="mono" style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-secondary)" }}>
                          {loc.lon.toFixed(4)}
                        </td>
                        <td className="mono" style={{ textAlign: "center", fontWeight: 700, color: C.critical }}>
                          {loc.deaths}
                        </td>
                        <td className="mono" style={{ textAlign: "center", fontWeight: 700, color: "var(--color-text-primary)" }}>
                          {loc.accidents}
                        </td>
                        <td>
                          <span className={`badge ${sevBadge(loc.severity)}`}>{loc.severity}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── Accidents by Time ──────────────────────────────────────────── */}
        {activeTab === "time" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Night Accidents",    value: 97, sub: "10 PM – 6 AM",  color: C.night, icon: "🌙" },
                { label: "Day Accidents",      value: 194, sub: "6 AM – 10 PM", color: C.day,   icon: "☀️" },
                { label: "Peak Hour Spikes",   value: 117, sub: "6–9 AM / 5–8 PM", color: C.peak, icon: "⚡" },
              ].map(c => (
                <div key={c.label} className="card" style={{ padding: "16px 18px", borderLeft: `3px solid ${c.color}` }}>
                  <div style={{ fontSize: 18, marginBottom: 6 }}>{c.icon}</div>
                  <div className="mono" style={{ fontSize: 32, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-primary)", marginTop: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 2 }}>{c.sub}</div>
                </div>
              ))}
            </div>

            {/* Stacked bar chart */}
            <div className="card" style={{ padding: 20 }}>
              <SectionHead
                icon="⏱️"
                title="Accidents by Hour of Day"
                sub="Night · Day · Peak hour breakdown across 24 h window"
              />
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={TIME_DATA} margin={{ top: 0, right: 8, bottom: 20, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: C.text, fontSize: 10 }} angle={-30} textAnchor="end"
                    axisLine={{ stroke: C.grid }} tickLine={false} />
                  <YAxis tick={{ fill: C.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "var(--color-text-secondary)", paddingTop: 8 }} />
                  <Bar dataKey="night" name="Night"    fill={C.night} radius={[3, 3, 0, 0]} stackId="a" />
                  <Bar dataKey="day"   name="Day"      fill={C.day}   radius={[0, 0, 0, 0]} stackId="a" />
                  <Bar dataKey="peak"  name="Peak Hour" fill={C.peak}  radius={[3, 3, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Insight cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { color: C.night, icon: "🌙", title: "Highest Night Risk Window", desc: "02:00 – 04:00 has the highest night-time accident count, driven by reduced visibility and fatigue." },
                { color: C.peak,  icon: "⚡", title: "Evening Rush Peak Danger",  desc: "18:00 – 20:00 spike accounts for 27% of all peak-hour accidents — school commute + office traffic." },
              ].map(c => (
                <div key={c.title} className="card" style={{
                  padding: "14px 16px",
                  borderTop: `3px solid ${c.color}`,
                  background: "var(--color-bg-secondary)",
                }}>
                  <div style={{ fontSize: 16, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Accidents by Severity ──────────────────────────────────────── */}
        {activeTab === "severity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Pie chart + legend */}
            <div className="card" style={{ padding: 20 }}>
              <SectionHead
                icon="🚨"
                title="Accident Distribution by Severity"
                sub="Proportion across Critical · Severe · Moderate · Minor"
              />
              <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                <ResponsiveContainer width="50%" height={260}>
                  <PieChart>
                    <defs>
                      {SEVERITY_DATA.map(d => (
                        <radialGradient key={d.name} id={`grad-${d.name}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={d.color} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={d.color} stopOpacity={0.6} />
                        </radialGradient>
                      ))}
                    </defs>
                    <Pie
                      data={SEVERITY_DATA}
                      cx="50%" cy="50%"
                      innerRadius={60}
                      outerRadius={105}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {SEVERITY_DATA.map(d => (
                        <Cell key={d.name} fill={`url(#grad-${d.name})`} stroke={d.color} strokeWidth={1.5} />
                      ))}
                    </Pie>
                    <Tooltip content={<Tip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend with progress bars */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                  {SEVERITY_DATA.map(d => {
                    const pct = Math.round((d.value / totalAccidents) * 100)
                    return (
                      <div key={d.name}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>{d.name}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{d.value}</span>
                            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{pct}%</span>
                          </div>
                        </div>
                        <div style={{ height: 5, borderRadius: 99, background: "var(--color-bg-tertiary)", overflow: "hidden" }}>
                          <div style={{
                            height: "100%", width: `${pct}%`, borderRadius: 99,
                            background: `linear-gradient(90deg, ${d.color}99, ${d.color})`,
                            transition: "width 600ms ease",
                          }} />
                        </div>
                      </div>
                    )
                  })}
                  <div style={{
                    marginTop: 6, padding: "10px 14px",
                    background: "var(--color-bg-tertiary)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    display: "flex", justifyContent: "space-between",
                  }}>
                    <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Total Accidents</span>
                    <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>{totalAccidents}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Severity metric cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {SEVERITY_DATA.map(d => {
                const pct = Math.round((d.value / totalAccidents) * 100)
                return (
                  <div key={d.name} className="card" style={{ padding: "16px 18px", borderTop: `3px solid ${d.color}` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                      {d.name}
                    </div>
                    <div className="mono" style={{ fontSize: 34, fontWeight: 700, color: d.color, lineHeight: 1 }}>
                      {d.value}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 6 }}>
                      {pct}% of total
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Side Panel ───────────────────────────────────────────────────────── */}
      <div style={{
        width: 272,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}>

        {/* 1. Top Accident Locations */}
        <div className="card" style={{ padding: 16 }}>
          <PanelHead
            title="🔴 Top Accident Locations"
            sub="Ranked by accident count"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TOP_ACCIDENT_LOCATIONS.slice(0, 5).map(loc => (
              <div key={loc.rank} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-bg-tertiary)",
                border: "1px solid var(--color-border)",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: loc.rank <= 3 ? `${C.critical}22` : `${C.severe}22`,
                  border: `1.5px solid ${loc.rank <= 3 ? C.critical : C.severe}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700,
                  color: loc.rank <= 3 ? C.critical : C.severe,
                  flexShrink: 0,
                }}>
                  {loc.rank}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: "var(--color-text-primary)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{loc.name}</div>
                  <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 1 }}>
                    {loc.district} · {loc.accidents} accidents
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: C.critical, flexShrink: 0 }}>
                  {loc.deaths}💀
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Severity Trends (radar) */}
        <div className="card" style={{ padding: 16 }}>
          <PanelHead
            title="📊 Severity Trends"
            sub="District-level critical case concentration"
          />
          <ResponsiveContainer width="100%" height={170}>
            <RadarChart data={TREND_RADAR} outerRadius={60}>
              <PolarGrid stroke={C.grid} />
              <PolarAngleAxis dataKey="axis" tick={{ fill: C.text, fontSize: 9 }} />
              <Radar name="Risk %" dataKey="A" stroke={C.critical} fill={C.critical} fillOpacity={0.2} strokeWidth={1.5} />
              <Tooltip content={<Tip />} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {SEVERITY_DATA.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "var(--color-text-secondary)", flex: 1 }}>{d.name}</span>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Time Patterns */}
        <div className="card" style={{ padding: 16 }}>
          <PanelHead
            title="⏰ Time Patterns"
            sub="When accidents peak across 24h"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Morning Rush", time: "06–09 AM", count: 83, pct: 76, color: C.orange, icon: "🌅" },
              { label: "Night Hours",  time: "10 PM – 4 AM", count: 97, pct: 89, color: C.night, icon: "🌙" },
              { label: "Evening Peak", time: "06–08 PM", count: 65, pct: 60, color: C.peak,   icon: "🌆" },
              { label: "Midday Lull",  time: "11 AM – 2 PM", count: 41, pct: 38, color: C.green,  icon: "☀️" },
            ].map(t => (
              <div key={t.label} style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-bg-tertiary)",
                border: "1px solid var(--color-border)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-primary)" }}>
                      {t.icon} {t.label}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 1 }}>{t.time}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.count}</span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: "var(--color-bg-hover)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${t.pct}%`, borderRadius: 99,
                    background: t.color, opacity: 0.8,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
