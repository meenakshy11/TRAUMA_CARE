import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function VitalSignsChart({ vitals }: { vitals: any[] }) {
  if (!vitals || vitals.length === 0) return (
    <div style={{ textAlign: "center", padding: 24, color: "#64748b", fontSize: 13 }}>No vitals recorded</div>
  )
  const data = vitals.map((v: any, i: number) => ({
    time: `T+${i * 5}min`,
    GCS: v.gcs_score,
    SpO2: v.spo2,
    Pulse: v.pulse_rate,
    SysBP: v.systolic_bp,
  }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 10 }} />
        <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
        <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", color: "#f1f5f9", fontSize: 12 }} />
        <Line type="monotone" dataKey="GCS" stroke="#3b82f6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="SpO2" stroke="#10b981" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Pulse" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="SysBP" stroke="#ef4444" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
