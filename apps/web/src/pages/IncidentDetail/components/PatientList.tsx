const TRIAGE_COLOR: Record<string, { label: string; color: string }> = {
  RED: { label: "IMMEDIATE", color: "#ef4444" },
  YELLOW: { label: "DELAYED", color: "#f59e0b" },
  GREEN: { label: "MINOR", color: "#10b981" },
  BLACK: { label: "EXPECTANT", color: "#374151" },
}

export function PatientList({ patients }: { patients: any[] }) {
  if (!patients || patients.length === 0) return <div style={{ color: "#64748b", fontSize: 13 }}>No patients recorded</div>
  return (
    <div>
      {patients.map((p: any) => {
        const triage = TRIAGE_COLOR[p.triage_color] || { label: "NOT ASSESSED", color: "#64748b" }
        return (
          <div key={p.id} style={{ background: "#1e293b", borderRadius: 6, padding: 12, marginBottom: 8, border: `1px solid ${triage.color}44` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name || `Patient ${p.sequence_no}`} · {p.age_estimate ? `${p.age_estimate}y` : "—"} / {p.gender}</div>
              <span style={{ fontSize: 10, background: `${triage.color}22`, color: triage.color, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{triage.label}</span>
            </div>
            {p.vitals && p.vitals.length > 0 && (
              <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#94a3b8" }}>
                {p.vitals[p.vitals.length - 1].gcs_score !== null && <span>GCS: <strong style={{ color: "#f1f5f9" }}>{p.vitals[p.vitals.length - 1].gcs_score}</strong></span>}
                {p.vitals[p.vitals.length - 1].spo2 !== null && <span>SpO2: <strong style={{ color: "#f1f5f9" }}>{p.vitals[p.vitals.length - 1].spo2}%</strong></span>}
                {p.vitals[p.vitals.length - 1].systolic_bp !== null && <span>BP: <strong style={{ color: "#f1f5f9" }}>{p.vitals[p.vitals.length - 1].systolic_bp}/{p.vitals[p.vitals.length - 1].diastolic_bp}</strong></span>}
              </div>
            )}
            {p.triage_score !== null && <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Triage Score: {p.triage_score}/10</div>}
          </div>
        )
      })}
    </div>
  )
}
