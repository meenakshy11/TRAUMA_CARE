const COLOR_MAP: Record<string, { label: string; color: string; desc: string }> = {
  RED: { label: "RED — Immediate", color: "#ef4444", desc: "Life-threatening injuries requiring immediate intervention" },
  YELLOW: { label: "YELLOW — Delayed", color: "#f59e0b", desc: "Serious injuries but can wait for treatment" },
  GREEN: { label: "GREEN — Minor", color: "#10b981", desc: "Minor injuries, can walk" },
  BLACK: { label: "BLACK — Expectant", color: "#374151", desc: "Not breathing or unsurvivable injuries" },
}

export function TriageCard({ triage }: { triage?: any }) {
  if (!triage) return <div style={{ color: "#64748b", fontSize: 13 }}>No triage assessment recorded</div>
  const c = COLOR_MAP[triage.triage_color] || { label: "Unknown", color: "#64748b", desc: "" }
  return (
    <div style={{ padding: 16, background: `${c.color}11`, border: `1px solid ${c.color}44`, borderRadius: 8 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: c.color, marginBottom: 6 }}>{c.label}</div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>{c.desc}</div>
      <div style={{ fontSize: 12, color: "#64748b" }}>Protocol: {triage.protocol}</div>
      {[
        ["Breathing", triage.is_breathing],
        ["Respirations OK", triage.respirations_ok],
        ["Perfusion OK", triage.perfusion_ok],
        ["Mental Status OK", triage.mental_status_ok],
      ].map(([label, val]) => (
        <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
          <span style={{ color: "#64748b" }}>{label}</span>
          <span style={{ color: val ? "#10b981" : "#ef4444" }}>{val ? "✓ Yes" : "✗ No"}</span>
        </div>
      ))}
    </div>
  )
}
