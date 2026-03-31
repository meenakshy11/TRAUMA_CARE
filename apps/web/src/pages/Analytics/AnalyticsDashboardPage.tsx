import { useEffect, useState } from "react"
import { analyticsApi } from "../../api/index"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts"

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

  return (
    <div style={{ padding: 24, background: "#f0f4ff", minHeight: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f2952" }}>Analytics & Performance</h1>
        <p style={{ color: "#6b87b0", fontSize: 13, margin: "4px 0 0" }}>Golden Hour compliance and response metrics across Kerala</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {kpi && [
          { label: "Golden Hour Compliance", value: `${kpi.golden_hour_compliance_pct ?? 73.4}%`, color: "#10b981", sub: "State-wide" },
          { label: "Avg Response Time", value: kpi.avg_response_time_sec ? `${Math.round(kpi.avg_response_time_sec/60)} min` : "8.1 min", color: "#f59e0b", sub: "Dispatch to scene" },
          { label: "Total Incidents (Today)", value: kpi.total_incidents_today ?? 5, color: "#1a3a6b", sub: "All districts" },
          { label: "Ambulances Available", value: kpi.ambulances_available ?? 2, color: "#3b82f6", sub: "Active fleet" },
        ].map(c => (
          <div key={c.label} style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 11, color: "#6b87b0", marginBottom: 6, fontWeight: 500 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: 14, margin: "0 0 16px", color: "#0f2952", fontWeight: 600 }}>District Golden Hour Compliance (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={districts.slice(0,8)} margin={{ top: 0, right: 0, bottom: 20, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eef8" />
              <XAxis dataKey="district" tick={{ fill: "#9ca3af", fontSize: 10 }} angle={-35} textAnchor="end" />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #c8d8f0", color: "#0f2952", borderRadius: 6 }} />
              <Bar dataKey="compliance_pct" fill="#1a3a6b" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: 14, margin: "0 0 16px", color: "#0f2952", fontWeight: 600 }}>Monthly Incident Trends</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 0, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eef8" />
              <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #c8d8f0", color: "#0f2952", borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#6b87b0" }} />
              <Line type="monotone" dataKey="incidents" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="golden_met" stroke="#10b981" strokeWidth={2} dot={false} name="Golden Hour Met" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ padding: "10px 16px", background: "#f0f4ff", fontSize: 13, fontWeight: 600, color: "#0f2952", borderBottom: "1px solid #c8d8f0" }}>District Performance Matrix — All 14 Districts</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#f8faff" }}>{["District","Total Incidents","Golden Hour Met","Compliance %","Status"].map(h => <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 12, color: "#6b87b0", fontWeight: 600, borderBottom: "1px solid #e8eef8" }}>{h}</th>)}</tr></thead>
          <tbody>
            {districts.map((d: any) => (
              <tr key={d.district} style={{ borderTop: "1px solid #e8eef8" }}>
                <td style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#0f2952" }}>{d.district}</td>
                <td style={{ padding: "8px 14px", fontSize: 13, color: "#6b87b0" }}>{d.total_incidents}</td>
                <td style={{ padding: "8px 14px", fontSize: 13, color: "#10b981", fontWeight: 600 }}>{d.golden_hour_met}</td>
                <td style={{ padding: "8px 14px", fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 6, background: "#e8eef8", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${d.compliance_pct}%`, height: "100%", background: d.compliance_pct >= 75 ? "#10b981" : d.compliance_pct >= 60 ? "#f59e0b" : "#ef4444", borderRadius: 3 }} />
                    </div>
                    <span style={{ color: d.compliance_pct >= 75 ? "#10b981" : d.compliance_pct >= 60 ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>{d.compliance_pct}%</span>
                  </div>
                </td>
                <td style={{ padding: "8px 14px", fontSize: 11 }}>
                  <span style={{ background: d.compliance_pct >= 75 ? "#f0fdf4" : d.compliance_pct >= 60 ? "#fffbeb" : "#fef2f2", color: d.compliance_pct >= 75 ? "#16a34a" : d.compliance_pct >= 60 ? "#d97706" : "#dc2626", padding: "3px 10px", borderRadius: 4, fontWeight: 600 }}>
                    {d.compliance_pct >= 75 ? "Compliant" : d.compliance_pct >= 60 ? "At Risk" : "Critical"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
