import { useEffect, useState } from "react"
import { analyticsApi } from "../../api/index"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts"

const CHART_COLORS = {
  grid: "var(--color-border)",
  text: "var(--color-text-muted)",
  blue: "#3b82f6",
  green: "#10b981",
  orange: "#f59e0b",
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-sm)", padding: "10px 14px", boxShadow: "var(--shadow-elevated)" }}>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
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

export function AnalyticsDashboardPage() {
  const [kpi, setKpi] = useState<any>(null)
  const [districts, setDistricts] = useState<any[]>([])

  useEffect(() => {
    analyticsApi.getKPI().then(r => setKpi(r.data))
    analyticsApi.getDistrictPerformance().then(r => setDistricts(Array.isArray(r.data) ? r.data : []))
  }, [])

  const trendData = [
    { month: "Oct", incidents: 156, golden_met: 118 },
    { month: "Nov", incidents: 178, golden_met: 134 },
    { month: "Dec", incidents: 201, golden_met: 149 },
    { month: "Jan", incidents: 189, golden_met: 143 },
    { month: "Feb", incidents: 212, golden_met: 165 },
    { month: "Mar", incidents: 234, golden_met: 189 },
  ]

  const kpiCards = kpi ? [
    { label: "Golden Hour Compliance", value: `${kpi.golden_hour_compliance_pct ?? 73.4}%`, color: "var(--color-success)", sub: "State-wide" },
    { label: "Avg Response Time",      value: kpi.avg_response_time_sec ? `${Math.round(kpi.avg_response_time_sec/60)} min` : "8.1 min", color: "var(--color-warning)", sub: "Dispatch to scene" },
    { label: "Incidents Today",        value: kpi.total_incidents_today ?? 5, color: "var(--color-accent-blue)", sub: "All districts" },
    { label: "Ambulances Available",   value: kpi.ambulances_available ?? 2, color: "var(--color-accent-cyan)", sub: "Active fleet" },
  ] : []

  const complianceColor = (pct: number) =>
    pct >= 75 ? "var(--color-success)" : pct >= 60 ? "var(--color-warning)" : "var(--color-danger)"

  const complianceLabel = (pct: number) =>
    pct >= 75 ? "Compliant" : pct >= 60 ? "At Risk" : "Critical"

  const complianceBadge = (pct: number) =>
    pct >= 75 ? "badge-success" : pct >= 60 ? "badge-warning" : "badge-danger"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>
          Analytics & Performance
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 13, margin: "4px 0 0" }}>
          Golden Hour compliance and response metrics across Kerala
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {kpiCards.map(c => (
          <div key={c.label} className="card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
              {c.label}
            </div>
            <div className="mono" style={{ fontSize: 36, fontWeight: 700, color: c.color, lineHeight: 1 }}>
              {c.value}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 8 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Bar Chart */}
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
                angle={-35} 
                textAnchor="end"
                axisLine={{ stroke: CHART_COLORS.grid }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: CHART_COLORS.text, fontSize: 11 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="compliance_pct" fill={CHART_COLORS.blue} radius={[4,4,0,0]} name="Compliance %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
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
              <XAxis 
                dataKey="month" 
                tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                axisLine={{ stroke: CHART_COLORS.grid }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: CHART_COLORS.text, fontSize: 11 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "var(--color-text-secondary)", paddingTop: 12 }} />
              <Line type="monotone" dataKey="incidents" stroke={CHART_COLORS.blue} strokeWidth={2} dot={false} name="Total Incidents" />
              <Line type="monotone" dataKey="golden_met" stroke={CHART_COLORS.green} strokeWidth={2} dot={false} name="Golden Hour Met" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* District Performance Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
            District Performance Matrix — All 14 Districts
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
  )
}
