import { useEffect, useState } from "react"
import { hospitalsApi } from "../../api/index"
import toast from "react-hot-toast"

export function HospitalListPage() {
  const [hospitals, setHospitals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    hospitalsApi.getAll().then(r => {
      setHospitals(Array.isArray(r.data) ? r.data : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const stats = {
    total: hospitals.length,
    govt: hospitals.filter(h => h.is_government).length,
    kasb: hospitals.filter(h => h.is_kasb_empaneled).length,
    l1: hospitals.filter(h => h.trauma_level === "LEVEL_1").length,
  }

  return (
    <div style={{ padding: 24, fontFamily: "Arial", color: "#f1f5f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Hospital Management</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Trauma centers and emergency facilities across Kerala</p>
        </div>
        <button onClick={() => toast("Add Hospital form coming soon")} style={{ padding: "8px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>+ Add Hospital</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Hospitals", value: stats.total, color: "#f1f5f9" },
          { label: "Government", value: stats.govt, color: "#3b82f6" },
          { label: "KASB Empaneled", value: stats.kasb, color: "#f59e0b" },
          { label: "Level 1 Trauma", value: stats.l1, color: "#ef4444" },
        ].map(c => (
          <div key={c.label} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Loading...</div> : (
        <div style={{ background: "#111827", borderRadius: 8, border: "1px solid #1f2937", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#0f172a" }}>{["Hospital Name","Type","District","Trauma","ICU","Load","OT","KASB"].map(h => <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, color: "#64748b" }}>{h}</th>)}</tr></thead>
            <tbody>
              {hospitals.map((h: any) => {
                const loadPct = h.resources ? Math.round((h.resources.ed_capacity_current / h.resources.ed_capacity_total) * 100) : 0
                return (
                  <tr key={h.id} style={{ borderTop: "1px solid #1f2937" }}>
                    <td style={{ padding: "8px 14px", fontSize: 13, fontWeight: 500 }}>{h.name}</td>
                    <td style={{ padding: "8px 14px", fontSize: 12 }}>
                      <span style={{ background: h.is_government ? "#3b82f622" : "#64748b22", color: h.is_government ? "#3b82f6" : "#94a3b8", padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>{h.is_government ? "Government" : "Private"}</span>
                    </td>
                    <td style={{ padding: "8px 14px", fontSize: 12, color: "#94a3b8" }}>{h.district}</td>
                    <td style={{ padding: "8px 14px", fontSize: 12 }}>
                      <span style={{ background: h.trauma_level === "LEVEL_1" ? "#ef444422" : "#f59e0b22", color: h.trauma_level === "LEVEL_1" ? "#ef4444" : "#f59e0b", padding: "1px 6px", borderRadius: 4 }}>{h.trauma_level?.replace("_"," ")}</span>
                    </td>
                    <td style={{ padding: "8px 14px", fontSize: 12 }}>{h.resources?.icu_beds_available ?? "—"}/{h.resources?.icu_beds_total ?? "—"}</td>
                    <td style={{ padding: "8px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 50, height: 5, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${loadPct}%`, height: "100%", background: loadPct > 80 ? "#ef4444" : loadPct > 60 ? "#f59e0b" : "#10b981", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{loadPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "8px 14px", fontSize: 12, color: h.resources?.ot_available ? "#10b981" : "#ef4444" }}>{h.resources?.ot_available ? "Ready" : "Busy"}</td>
                    <td style={{ padding: "8px 14px", fontSize: 12, color: h.is_kasb_empaneled ? "#10b981" : "#64748b" }}>{h.is_kasb_empaneled ? "Yes" : "No"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
