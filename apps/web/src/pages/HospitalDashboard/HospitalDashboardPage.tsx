import { useEffect, useState } from "react"
import { hospitalsApi } from "../../api/index"
import { DevBanner } from "../../components/DevBanner"

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

  const triageColor: Record<string, string> = { RED: "#ef4444", YELLOW: "#f59e0b", GREEN: "#10b981", BLACK: "#374151" }

  return (
    <div style={{ padding: 24, fontFamily: "Arial", color: "#f1f5f9" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Hospital Emergency Dashboard</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Pre-arrival alerts and resource management</p>
      </div>

      <DevBanner
        feature="Live Pre-Arrival Alert System"
        description="Real-time patient triage data transmitted from ambulance to hospital before arrival. Enables trauma team pre-activation."
        progress={72}
        eta="Q2 2026"
      />

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        <div>
          <h3 style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 12px" }}>Select Hospital</h3>
          {loading ? <div style={{ color: "#64748b" }}>Loading...</div> : hospitals.map(h => (
            <div key={h.id} onClick={() => setSelected(h)}
              style={{ padding: "10px 14px", background: selected?.id === h.id ? "#1e3a5f" : "#111827", border: `1px solid ${selected?.id === h.id ? "#3b82f6" : "#1f2937"}`, borderRadius: 8, marginBottom: 8, cursor: "pointer" }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{h.name}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{h.district} · {h.trauma_level?.replace("_"," ")}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 11, color: "#10b981" }}>ICU: {h.resources?.icu_beds_available || 0}/{h.resources?.icu_beds_total || 0}</span>
                <span style={{ fontSize: 11, color: h.resources?.ot_available ? "#10b981" : "#ef4444" }}>OT: {h.resources?.ot_available ? "Ready" : "Busy"}</span>
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
                  { label: "Ventilators", value: selected.resources?.ventilators_available || 0, color: "#3b82f6" },
                  { label: "ED Occupancy", value: `${selected.resources?.ed_capacity_current || 0}/${selected.resources?.ed_capacity_total || 0}`, color: "#f59e0b" },
                  { label: "Blood Bank", value: selected.resources?.blood_bank_available ? "Available" : "Critical", color: selected.resources?.blood_bank_available ? "#10b981" : "#ef4444" },
                ].map(card => (
                  <div key={card.label} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{card.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 12px" }}>Incoming Patients (Pre-Arrival Alerts)</h3>
              {mockIncoming.map(p => (
                <div key={p.id} style={{ background: "#111827", border: `1px solid ${triageColor[p.triage_color]}44`, borderRadius: 8, padding: 16, marginBottom: 12, display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${triageColor[p.triage_color]}22`, border: `2px solid ${triageColor[p.triage_color]}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: triageColor[p.triage_color], fontWeight: 700, flexShrink: 0 }}>
                    {p.triage_color}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.incident}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Ambulance: {p.ambulance}</div>
                    <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12, color: "#64748b" }}>
                      <span>GCS: <strong style={{ color: "#f1f5f9" }}>{p.gcs}</strong></span>
                      <span>SpO2: <strong style={{ color: "#f1f5f9" }}>{p.spo2}%</strong></span>
                      <span>BP: <strong style={{ color: "#f1f5f9" }}>{p.bp}</strong></span>
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#f59e0b" }}>{p.eta_minutes}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>min ETA</div>
                  </div>
                  <button style={{ padding: "8px 14px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Acknowledge</button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
