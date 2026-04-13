import { useEffect, useState } from "react"
import { analyticsApi } from "../../api/index"
import { useDistrictStore } from "../../store/districtStore"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line,
  CartesianGrid, Legend,
} from "recharts"
import { RoadSafetyPanel } from "./components/RoadSafetyPanel"

// â”€â”€â”€ Chart palette â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CHART_COLORS = {
  grid:   "var(--color-border)",
  text:   "var(--color-text-muted)",
  blue:   "#3b82f6",
  green:  "#10b981",
  orange: "#f59e0b",
}

// â”€â”€â”€ Custom Tooltip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: "var(--color-bg-tertiary)",
      border: "1px solid var(--color-border-strong)",
      borderRadius: "var(--radius-sm)",
      padding: "10px 14px",
      boxShadow: "var(--shadow-elevated)",
    }}>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" }}>
        {label}
      </div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span style={{ color: "var(--color-text-secondary)" }}>{p.name}:</span>
          <span className="mono" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// â”€â”€â”€ Section Divider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SectionDivider = ({ title, sub, badge }: { title: string; sub: string; badge?: string }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 24px",
    background: "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(6,182,212,0.04) 100%)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    position: "relative",
    overflow: "hidden",
  }}>
    {/* Decorative glow */}
    <div style={{
      position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
      background: "linear-gradient(180deg, #3b82f6, #06b6d4)",
      borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
    }} />
    <div style={{ paddingLeft: 8 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 3 }}>{sub}</div>
    </div>
    {badge && (
      <span style={{
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: "rgba(239,68,68,0.12)",
        color: "#ef4444",
        border: "1px solid rgba(239,68,68,0.25)",
        letterSpacing: "0.05em",
      }}>
        {badge}
      </span>
    )}
  </div>
)

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function AnalyticsDashboardPage() {
  const { selectedDistrict } = useDistrictStore()
  const [kpi, setKpi]           = useState<any>(null)
  const [districts, setDistricts] = useState<any[]>([])
  const [activeSection, setActiveSection] = useState<"performance" | "road-safety">("performance")

  useEffect(() => {
    analyticsApi.getKPI(selectedDistrict || undefined).then(r => setKpi(r.data))
    analyticsApi.getDistrictPerformance().then(r => {
      const data = Array.isArray(r.data) ? r.data : []
      setDistricts(selectedDistrict ? data.filter((d: any) => d.district === selectedDistrict) : data)
    })
  }, [selectedDistrict])

  const trendData = [
    { month: "Oct", incidents: 156, golden_met: 118 },
    { month: "Nov", incidents: 178, golden_met: 134 },
    { month: "Dec", incidents: 201, golden_met: 149 },
    { month: "Jan", incidents: 189, golden_met: 143 },
    { month: "Feb", incidents: 212, golden_met: 165 },
    { month: "Mar", incidents: 234, golden_met: 189 },
  ]

  const kpiCards = [
    { label: "Golden Hour Compliance", value: `${kpi?.golden_hour_compliance_pct || 68}%`, color: "var(--color-warning)",       sub: "State-wide"       },
    { label: "Avg Response Time",      value: `${Math.round((kpi?.avg_response_time_sec || 486) / 60)} min`, color: "var(--color-warning)", sub: "Dispatch to scene" },
    { label: "Incidents Today",        value: kpi?.total_incidents_today || 142,  color: "var(--color-accent-blue)", sub: "All districts"    },
    { label: "Ambulances Available",   value: kpi?.ambulances_available || 186,   color: "var(--color-accent-cyan)", sub: "Active fleet"     },
  ]

  const complianceColor  = (p: number) => p >= 75 ? "var(--color-success)"  : p >= 60 ? "var(--color-warning)"  : "var(--color-danger)"
  const complianceLabel  = (p: number) => p >= 75 ? "Compliant"            : p >= 60 ? "At Risk"               : "Critical"
  const complianceBadge  = (p: number) => p >= 75 ? "badge-success"        : p >= 60 ? "badge-warning"         : "badge-danger"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* â”€â”€ Page Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.03em" }}>
            Analytics &amp; Performance
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 13, margin: "4px 0 0" }}>
            Golden Hour compliance Â· Response metrics Â· Road Safety Intelligence â€” Kerala
          </p>
        </div>

        {/* Section toggle */}
        <div style={{
          display: "flex", gap: 4, padding: 4,
          background: "var(--color-bg-tertiary)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
        }}>
          {([
            { id: "performance",  label: "ðŸ“Š Performance"     },
            { id: "road-safety",  label: "ðŸš— Road Safety"     },
          ] as const).map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                padding: "7px 16px",
                borderRadius: "calc(var(--radius-sm) - 2px)",
                fontSize: 12,
                fontWeight: 600,
                background: activeSection === s.id ? "var(--color-accent-blue)" : "transparent",
                color:      activeSection === s.id ? "#fff" : "var(--color-text-secondary)",
                border: "none",
                cursor: "pointer",
                transition: "all 150ms ease",
                whiteSpace: "nowrap",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SECTION A â€” Golden Hour & Performance
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeSection === "performance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {kpiCards.map(c => (
              <div key={c.label} className="card" style={{ padding: "18px 20px" }}>
                <div style={{
                  fontSize: 11, color: "var(--color-text-secondary)",
                  fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: "0.05em", marginBottom: 8,
                }}>
                  {c.label}
                </div>
                <div className="mono" style={{ fontSize: 34, fontWeight: 700, color: c.color, lineHeight: 1 }}>
                  {c.value}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 8 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

            {/* District Bar Chart */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
                  District Golden Hour Compliance
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>Percentage by district</div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={districts.slice(0, 8)} margin={{ top: 0, right: 0, bottom: 28, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis
                    dataKey="district"
                    tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
                    angle={-35} textAnchor="end"
                    axisLine={{ stroke: CHART_COLORS.grid }} tickLine={false}
                  />
                  <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="compliance_pct" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} name="Compliance %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Trend Line Chart */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
                  Monthly Incident Trends
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>Last 6 months</div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top: 0, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={{ stroke: CHART_COLORS.grid }} tickLine={false} />
                  <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "var(--color-text-secondary)", paddingTop: 12 }} />
                  <Line type="monotone" dataKey="incidents"  stroke={CHART_COLORS.blue}  strokeWidth={2} dot={false} name="Total Incidents"   />
                  <Line type="monotone" dataKey="golden_met" stroke={CHART_COLORS.green} strokeWidth={2} dot={false} name="Golden Hour Met" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* District Performance Table */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--color-border)",
              background: "var(--color-bg-tertiary)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
                District Performance Matrix â€” All 14 Districts
              </div>
              <span className="badge badge-muted">Live</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>District</th>
                    <th style={{ textAlign: "center" }}>Total Incidents</th>
                    <th style={{ textAlign: "center" }}>Golden Hour Met</th>
                    <th>Compliance Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {districts.map((d: any) => (
                    <tr key={d.district}>
                      <td style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{d.district}</td>
                      <td className="mono" style={{ textAlign: "center" }}>{d.total_incidents}</td>
                      <td className="mono" style={{ textAlign: "center", color: "var(--color-success)", fontWeight: 600 }}>
                        {d.golden_hour_met}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 80, height: 6, background: "var(--color-bg-tertiary)", borderRadius: 99, overflow: "hidden", flexShrink: 0 }}>
                            <div style={{ width: `${d.compliance_pct}%`, height: "100%", background: complianceColor(d.compliance_pct), borderRadius: 99 }} />
                          </div>
                          <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: complianceColor(d.compliance_pct), width: 40 }}>
                            {d.compliance_pct}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${complianceBadge(d.compliance_pct)}`}>
                          {complianceLabel(d.compliance_pct)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SECTION B â€” Road Safety Analytics Panel
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeSection === "road-safety" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Section header banner */}
          <SectionDivider
            title="Road Safety Analytics Panel"
            sub="Accident hotspots Â· Time patterns Â· Severity distribution across Kerala road network"
            badge="âš ï¸ HIGH RISK ZONES ACTIVE"
          />

          {/* Stat strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Total Accidents",  value: "242",  color: "#ef4444", sub: "Last 30 days",    icon: "ðŸ’¥" },
              { label: "Fatalities",       value: "87",   color: "#f97316", sub: "Road accidents",  icon: "ðŸ’€" },
              { label: "Black Spots",      value: "10",   color: "#f59e0b", sub: "Tracked zones",   icon: "ðŸ“" },
              { label: "Peak Risk Hour",   value: "02â€“04 AM", color: "#6366f1", sub: "Night window", icon: "ðŸŒ™" },
            ].map(c => (
              <div key={c.label} className="card" style={{
                padding: "14px 18px",
                borderTop: `3px solid ${c.color}`,
              }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
                <div className="mono" style={{ fontSize: 28, fontWeight: 800, color: c.color, lineHeight: 1 }}>
                  {c.value}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-primary)", marginTop: 6 }}>
                  {c.label}
                </div>
                <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 2 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Main Road Safety Panel (charts + side panel) */}
          <RoadSafetyPanel />

        </div>
      )}

    </div>
  )
}


