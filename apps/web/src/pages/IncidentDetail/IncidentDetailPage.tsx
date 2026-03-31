import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { incidentsApi, patientsApi } from "../../api/index"

export function IncidentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [incident, setIncident] = useState<any>(null)
  const [patients, setPatients] = useState<any[]>([])

  useEffect(() => {
    if (!id) return
    incidentsApi.getOne(id).then(r => setIncident(r.data))
    patientsApi.getForIncident(id).then(r => setPatients(Array.isArray(r.data) ? r.data : []))
  }, [id])

  if (!incident) return <div style={{ padding: 40, color: "#64748b", fontFamily: "Arial" }}>Loading incident...</div>

  return (
    <div style={{ padding: 24, fontFamily: "Arial", color: "#f1f5f9" }}>
      <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, marginBottom: 16 }}>← Back</button>
      <h1 style={{ margin: "0 0 4px", fontSize: 20 }}>{incident.incident_number}</h1>
      <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 20px" }}>{incident.address_text || `${incident.latitude}, ${incident.longitude}`}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontSize: 14, margin: "0 0 12px" }}>Incident Details</h3>
          {[["Status", incident.status], ["Severity", incident.severity], ["Type", incident.accident_type], ["District", incident.district], ["Patients", incident.patient_count], ["Golden Hour", incident.golden_hour_met === null ? "Pending" : incident.golden_hour_met ? "✅ Met" : "❌ Missed"]].map(([k, v]) => (
            <div key={k as string} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1f2937", fontSize: 13 }}>
              <span style={{ color: "#64748b" }}>{k}</span>
              <span>{v || "—"}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontSize: 14, margin: "0 0 12px" }}>Timeline</h3>
          {(incident.timeline || []).map((t: any) => (
            <div key={t.id} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0, marginTop: 5 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.status?.replace(/_/g, " ")}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{t.note} · {new Date(t.created_at).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
          {(!incident.timeline || incident.timeline.length === 0) && <div style={{ color: "#64748b", fontSize: 13 }}>No timeline entries</div>}
        </div>
      </div>
      <div style={{ marginTop: 20, background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: 16 }}>
        <h3 style={{ fontSize: 14, margin: "0 0 12px" }}>Patients ({patients.length})</h3>
        {patients.length === 0 ? <div style={{ color: "#64748b", fontSize: 13 }}>No patients recorded</div> : patients.map((p: any) => (
          <div key={p.id} style={{ padding: 12, background: "#1e293b", borderRadius: 6, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name || `Patient ${p.sequence_no}`} · {p.age_estimate}y/{p.gender}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Triage: {p.triage_color || "Not assessed"} · Score: {p.triage_score ?? "—"}/10</div>
          </div>
        ))}
      </div>
    </div>
  )
}
