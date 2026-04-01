import { useEffect, useState } from "react"
import { hospitalsApi } from "../../api/index"
import { DevBanner } from "../../components/DevBanner"
import TriageColorBadge from "../../components/TriageColorBadge"

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

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>
          Hospital Emergency Dashboard
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 13, margin: "4px 0 0" }}>
          Pre-arrival alerts and resource management
        </p>
      </div>

      <DevBanner 
        feature="Live Pre-Arrival Alert System" 
        description="Real-time patient triage data transmitted from ambulance to hospital before arrival. Enables trauma team pre-activation." 
        progress={72} 
        eta="Q2 2026" 
      />

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
        
        {/* Left Column: Hospital List */}
        <div className="card" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 240px)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <h3 style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>
              SELECT HOSPITAL
            </h3>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            {loading ? (
              <div style={{ color: "var(--color-text-muted)", padding: "20px", textAlign: "center" }}>Loading...</div>
            ) : hospitals.map(h => {
              const isActive = selected?.id === h.id
              const hasICU = (h.resources?.icu_beds_available || 0) > 0
              return (
                <div 
                  key={h.id} 
                  onClick={() => setSelected(h)}
                  style={{ 
                    padding: "12px 16px",
                    background: isActive ? "var(--color-bg-hover)" : "transparent",
                    border: "1px solid",
                    borderColor: isActive ? "var(--color-accent-blue)" : "transparent", 
                    borderLeft: isActive ? "3px solid var(--color-accent-blue)" : "3px solid transparent",
                    borderRadius: "var(--radius-md)", 
                    marginBottom: 8, 
                    cursor: "pointer",
                    transition: "all var(--transition-fast)"
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? "var(--color-accent-blue)" : "var(--color-text-primary)" }}>{h.name}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{h.district} · {h.trauma_level?.replace(/_/g," ")}</div>
                  
                  <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: hasICU ? "var(--color-success)" : "var(--color-danger)", fontWeight: 600 }}>
                      ICU: {h.resources?.icu_beds_available || 0}
                    </span>
                    <span style={{ fontSize: 11, color: h.resources?.ot_available ? "var(--color-success)" : "var(--color-danger)", fontWeight: 600 }}>
                      OT: {h.resources?.ot_available ? "Ready" : "Busy"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Dashboard Details */}
        <div>
          {selected && (
            <>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "ICU Available", value: selected.resources?.icu_beds_available || 0, color: "var(--color-success)" },
                  { label: "Ventilators", value: selected.resources?.ventilators_available || 0, color: "var(--color-accent-blue)" },
                  { label: "ED Occupancy", value: `${selected.resources?.ed_capacity_current || 0}/${selected.resources?.ed_capacity_total || 0}`, color: "var(--color-warning)" },
                  { label: "Blood Bank", value: selected.resources?.blood_bank_available ? "Available" : "Critical", color: selected.resources?.blood_bank_available ? "var(--color-success)" : "var(--color-danger)" },
                ].map((card, i) => (
                  <div key={i} className="card" style={{ padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
                    <div className="mono" style={{ fontSize: 26, fontWeight: 700, color: card.color }}>{card.value}</div>
                    {/* Fake trend indicators for detail */}
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 11.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L10 10.586 13.586 7H12z" clipRule="evenodd"/></svg>
                      Last updated
                    </div>
                  </div>
                ))}
              </div>

              {/* Incoming Patients */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, color: "var(--color-text-primary)", margin: 0, fontWeight: 700 }}>
                  INCOMING PATIENTS — PRE-ARRIVAL ALERTS
                </h3>
              </div>

              {mockIncoming.map(p => {
                const isCritical = p.eta_minutes < 10
                
                return (
                  <div key={p.id} className="card" style={{ padding: 20, marginBottom: 16, display: "flex", gap: 24, alignItems: "center", borderLeft: isCritical ? "3px solid var(--color-danger)" : "3px solid var(--color-border)", animation: isCritical ? "danger-glow 2s infinite" : "none" }}>
                    {/* Triage Badge */}
                    <TriageColorBadge color={p.triage_color} showIcon={false} className="mono" />

                    {/* Patient Info */}
                    <div style={{ flex: 1 }}>
                      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>{p.incident}</div>
                      <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
                        Ambulance: <span className="mono">{p.ambulance}</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                        <div style={{ background: "var(--color-bg-tertiary)", padding: "4px 8px", borderRadius: "var(--radius-sm)", fontSize: 12 }}>
                          <span style={{ color: "var(--color-text-secondary)" }}>GCS: </span>
                          <strong className="mono" style={{ color: "var(--color-text-primary)" }}>{p.gcs}</strong>
                        </div>
                        <div style={{ background: "var(--color-bg-tertiary)", padding: "4px 8px", borderRadius: "var(--radius-sm)", fontSize: 12 }}>
                          <span style={{ color: "var(--color-text-secondary)" }}>SpO2: </span>
                          <strong className="mono" style={{ color: "var(--color-text-primary)" }}>{p.spo2}%</strong>
                        </div>
                        <div style={{ background: "var(--color-bg-tertiary)", padding: "4px 8px", borderRadius: "var(--radius-sm)", fontSize: 12 }}>
                          <span style={{ color: "var(--color-text-secondary)" }}>BP: </span>
                          <strong className="mono" style={{ color: "var(--color-text-primary)" }}>{p.bp}</strong>
                        </div>
                      </div>
                    </div>

                    {/* ETA Block */}
                    <div style={{ textAlign: "right", minWidth: 80, paddingRight: 16, borderRight: "1px solid var(--color-border)" }}>
                      <div className="mono" style={{ fontSize: 32, fontWeight: 800, color: isCritical ? "var(--color-danger)" : "var(--color-warning)", lineHeight: 1 }}>
                        {p.eta_minutes}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, marginTop: 4 }}>
                        MIN ETA
                      </div>
                    </div>

                    {/* Action */}
                    <button className="btn btn-primary">
                      Acknowledge
                    </button>
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
