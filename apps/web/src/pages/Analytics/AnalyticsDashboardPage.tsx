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
    <div style={{ padding: 24, fontFamily: "Arial", color: "#f1f5f9" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Analytics & Performance</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Golden Hour compliance and response metrics across Kerala</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {kpi && [
          { label: "Golden Hour Compliance", value: `${kpi.golden_hour_compliance_pct ?? 73.4}%`, color: "#10b981", sub: "State-wide" },
          { label: "Avg Response Time", value: kpi.avg_response_time_sec ? `${Math.round(kpi.avg_response_time_sec/60)} min` : "8.1 min", color: "#f59e0b", sub: "Dispatch to scene" },
          { label: "Total Incidents (Today)", value: kpi.total_incidents_today ?? 5, color: "#3b82f6", sub: "All districts" },
          { label: "Ambulances Available", value: kpi.ambulances_available ?? 2, color: "#10b981", sub: `of ${(kpi.ambulances_available ?? 2) + 3} total` },
        ].map(c => (
          <div key={c.label} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontSize: 14, margin: "0 0 16px", color: "#94a3b8" }}>District Golden Hour Compliance (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={districts.slice(0,8)} margin={{ top: 0, right: 0, bottom: 20, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="district" tick={{ fill: "#64748b", fontSize: 10 }} angle={-35} textAnchor="end" />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" }} />
              <Bar dataKey="compliance_pct" fill="#10b981" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontSize: 14, margin: "0 0 16px", color: "#94a3b8" }}>Monthly Incident Trends</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 0, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              <Line type="monotone" dataKey="incidents" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="golden_met" stroke="#10b981" strokeWidth={2} dot={false} name="Golden Hour Met" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "#1e293b", fontSize: 13, fontWeight: 500 }}>District Performance Matrix — All 14 Districts</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#0f172a" }}>{["District","Total Incidents","Golden Hour Met","Compliance %","Status"].map(h => <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, color: "#64748b" }}>{h}</th>)}</tr></thead>
          <tbody>
            {districts.map((d: any) => (
              <tr key={d.district} style={{ borderTop: "1px solid #1f2937" }}>
                <td style={{ padding: "8px 14px", fontSize: 13, fontWeight: 500 }}>{d.district}</td>
                <td style={{ padding: "8px 14px", fontSize: 13, color: "#94a3b8" }}>{d.total_incidents}</td>
                <td style={{ padding: "8px 14px", fontSize: 13, color: "#10b981" }}>{d.golden_hour_met}</td>
                <td style={{ padding: "8px 14px", fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${d.compliance_pct}%`, height: "100%", background: d.compliance_pct >= 75 ? "#10b981" : d.compliance_pct >= 60 ? "#f59e0b" : "#ef4444", borderRadius: 3 }} />
                    </div>
                    <span style={{ color: d.compliance_pct >= 75 ? "#10b981" : d.compliance_pct >= 60 ? "#f59e0b" : "#ef4444" }}>{d.compliance_pct}%</span>
                  </div>
                </td>
                <td style={{ padding: "8px 14px", fontSize: 11 }}>
                  <span style={{ background: d.compliance_pct >= 75 ? "#10b98122" : d.compliance_pct >= 60 ? "#f59e0b22" : "#ef444422", color: d.compliance_pct >= 75 ? "#10b981" : d.compliance_pct >= 60 ? "#f59e0b" : "#ef4444", padding: "2px 8px", borderRadius: 4 }}>
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
