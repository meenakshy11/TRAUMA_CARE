import { useEffect, useState } from "react"
import { hospitalsApi } from "../../api/index"

function DevBanner({ feature, description, progress, eta }: any) {
  return (
    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ background: "#fef3c7", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#92400e", fontWeight: 700, whiteSpace: "nowrap" }}>IN DEVELOPMENT</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#78350f", marginBottom: 4 }}>{feature}</div>
        <div style={{ fontSize: 12, color: "#92400e" }}>{description}</div>
        <div style={{ marginTop: 6, background: "#fde68a", borderRadius: 4, height: 4, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #f59e0b, #10b981)", borderRadius: 4 }} />
        </div>
        <div style={{ fontSize: 11, color: "#a16207", marginTop: 3 }}>{progress}% complete{eta ? ` · ETA: ${eta}` : ""}</div>
      </div>
    </div>
  )
}

export function HospitalDashboardPage() {
  const [hospitals, setHospitals] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    hospitalsApi.getAll().then(r => {
      const list = Array.isArray(r.data) ? r.data : []
      setHospitals(list)
      if (list.length > 0) setSelected(list[0])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const mockIncoming = [
    { id: 1, incident: "TRK-20240312-001", triage_color: "RED", eta_minutes: 8, gcs: 8, spo2: 88, bp: "90/60", ambulance: "KL-05-AA-1234" },
    { id: 2, incident: "TRK-20240312-003", triage_color: "YELLOW", eta_minutes: 14, gcs: 13, spo2: 94, bp: "110/70", ambulance: "KL-07-FF-2345" },
  ]

  const triageConfig: Record<string, { bg: string; border: string; color: string }> = {
    RED: { bg: "#fef2f2", border: "#fecaca", color: "#dc2626" },
    YELLOW: { bg: "#fffbeb", border: "#fde68a", color: "#d97706" },
    GREEN: { bg: "#f0fdf4", border: "#bbf7d0", color: "#16a34a" },
  }

  return (
    <div style={{ padding: 24, background: "#f0f4ff", minHeight: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f2952" }}>Hospital Emergency Dashboard</h1>
        <p style={{ color: "#6b87b0", fontSize: 13, margin: "4px 0 0" }}>Pre-arrival alerts and resource management</p>
      </div>
      <DevBanner feature="Live Pre-Arrival Alert System" description="Real-time patient triage data transmitted from ambulance to hospital before arrival. Enables trauma team pre-activation." progress={72} eta="Q2 2026" />
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        <div>
          <h3 style={{ fontSize: 13, color: "#6b87b0", margin: "0 0 10px", fontWeight: 600 }}>SELECT HOSPITAL</h3>
          {loading ? <div style={{ color: "#6b87b0" }}>Loading...</div> : hospitals.map(h => (
            <div key={h.id} onClick={() => setSelected(h)}
              style={{ padding: "10px 14px", background: selected?.id === h.id ? "#1a3a6b" : "#ffffff", border: `1px solid ${selected?.id === h.id ? "#1a3a6b" : "#c8d8f0"}`, borderRadius: 8, marginBottom: 8, cursor: "pointer" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: selected?.id === h.id ? "#fff" : "#0f2952" }}>{h.name}</div>
              <div style={{ fontSize: 11, color: selected?.id === h.id ? "#93c5fd" : "#6b87b0", marginTop: 2 }}>{h.district} · {h.trauma_level?.replace("_"," ")}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: selected?.id === h.id ? "#6ee7b7" : "#10b981", fontWeight: 600 }}>ICU: {h.resources?.icu_beds_available || 0}/{h.resources?.icu_beds_total || 0}</span>
                <span style={{ fontSize: 11, color: selected?.id === h.id ? "#93c5fd" : (h.resources?.ot_available ? "#10b981" : "#ef4444"), fontWeight: 600 }}>OT: {h.resources?.ot_available ? "Ready" : "Busy"}</span>
              </div>
            </div>
          ))}
        </div>
        <div>
          {selected && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "ICU Available", value: selected.resources?.icu_beds_available || 0, color: "#10b981" },
                  { label: "Ventilators", value: selected.resources?.ventilators_available || 0, color: "#1a3a6b" },
                  { label: "ED Occupancy", value: `${selected.resources?.ed_capacity_current || 0}/${selected.resources?.ed_capacity_total || 0}`, color: "#f59e0b" },
                  { label: "Blood Bank", value: selected.resources?.blood_bank_available ? "Available" : "Critical", color: selected.resources?.blood_bank_available ? "#10b981" : "#ef4444" },
                ].map(card => (
                  <div key={card.label} style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ fontSize: 11, color: "#6b87b0", marginBottom: 4, fontWeight: 500 }}>{card.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</div>
                  </div>
                ))}
              </div>
              <h3 style={{ fontSize: 13, color: "#6b87b0", margin: "0 0 12px", fontWeight: 600 }}>INCOMING PATIENTS — PRE-ARRIVAL ALERTS</h3>
              {mockIncoming.map(p => {
                const tc = triageConfig[p.triage_color] || { bg: "#f1f5f9", border: "#e2e8f0", color: "#475569" }
                return (
                  <div key={p.id} style={{ background: "#ffffff", border: `1px solid ${tc.border}`, borderRadius: 8, padding: 16, marginBottom: 12, display: "flex", gap: 16, alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: tc.bg, border: `2px solid ${tc.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: tc.color, fontWeight: 700, flexShrink: 0 }}>
                      {p.triage_color}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f2952" }}>{p.incident}</div>
                      <div style={{ fontSize: 12, color: "#6b87b0", marginTop: 2 }}>Ambulance: {p.ambulance}</div>
                      <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
                        <span>GCS: <strong style={{ color: "#0f2952" }}>{p.gcs}</strong></span>
                        <span>SpO2: <strong style={{ color: "#0f2952" }}>{p.spo2}%</strong></span>
                        <span>BP: <strong style={{ color: "#0f2952" }}>{p.bp}</strong></span>
                      </div>
                    </div>
                    <div style={{ textAlign: "center", minWidth: 60 }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b" }}>{p.eta_minutes}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>min ETA</div>
                    </div>
                    <button style={{ padding: "8px 14px", background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Acknowledge</button>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
