import { useIncidentStore } from "../../../store/incidentStore"
import StatusBadge from "../../../components/StatusBadge"

export function IncidentPanel() {
  const incidents = useIncidentStore((s) => s.incidents)
  const list = Object.values(incidents).sort((a: any, b: any) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const handleDispatch = (id: string) => {
    alert("Open dispatch modal for: " + id) // stub
  }

  if (list.length === 0) {
    return <div style={{ color: "var(--color-text-muted)", fontSize: "13px", textAlign: "center", padding: "32px 0" }}>No active incidents</div>
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {list.map((inc: any) => {
        const isCritical = inc.severity === "CRITICAL"
        return (
          <div key={inc.id} className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
                  {inc.incident_number}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  {inc.accident_type?.replace(/_/g, " ")} · {inc.patient_count} Patient{inc.patient_count > 1 ? "s" : ""}
                </div>
              </div>
              <StatusBadge status={inc.status} />
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "center" }}>
              <span className={`badge ${isCritical ? 'badge-critical' : 'badge-warning'}`}>
                {inc.severity}
              </span>
              <span className="badge badge-muted">
                {inc.district || "Unknown Dist"}
              </span>
            </div>

            {inc.status === "REPORTED" && (
              <button 
                onClick={() => handleDispatch(inc.id)}
                className="btn btn-primary btn-sm btn-full"
                style={{ marginTop: 14 }}
              >
                Dispatch Ambulance
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
