import { useEffect, useState } from "react"
import { hospitalsApi } from "../../api/index"
import toast from "react-hot-toast"

export function HospitalListPage() {
  const [hospitals, setHospitals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { hospitalsApi.getAll().then(r => { setHospitals(Array.isArray(r.data) ? r.data : []); setLoading(false) }).catch(() => setLoading(false)) }, [])
  const stats = { total: hospitals.length, govt: hospitals.filter(h => h.is_government).length, kasb: hospitals.filter(h => h.is_kasb_empaneled).length, l1: hospitals.filter(h => h.trauma_level === "LEVEL_1").length }

  return (
    <div style={{ padding: 24, background: "#f0f4ff", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f2952" }}>Hospital Management</h1>
          <p style={{ color: "#6b87b0", fontSize: 13, margin: "4px 0 0" }}>Trauma centers and emergency facilities across Kerala</p>
        </div>
        <button onClick={() => toast("Add Hospital form coming soon")} style={{ padding: "8px 16px", background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Hospital</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Hospitals", value: stats.total, color: "#0f2952" },
          { label: "Government", value: stats.govt, color: "#1a3a6b" },
          { label: "KASB Empaneled", value: stats.kasb, color: "#f59e0b" },
          { label: "Level 1 Trauma", value: stats.l1, color: "#ef4444" },
        ].map(c => (
          <div key={c.label} style={{ background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 11, color: "#6b87b0", fontWeight: 500 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 40, color: "#6b87b0" }}>Loading...</div> : (
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #c8d8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f0f4ff" }}>{["Hospital Name","Type","District","Trauma","ICU","Load","OT","KASB"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#6b87b0", fontWeight: 600, borderBottom: "1px solid #c8d8f0" }}>{h}</th>)}</tr></thead>
            <tbody>
              {hospitals.map((h: any) => {
                const loadPct = h.resources ? Math.round((h.resources.ed_capacity_current / h.resources.ed_capacity_total) * 100) : 0
                return (
                  <tr key={h.id} style={{ borderTop: "1px solid #e8eef8" }}>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#0f2952" }}>{h.name}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12 }}>
                      <span style={{ background: h.is_government ? "#dbeafe" : "#f1f5f9", color: h.is_government ? "#1d4ed8" : "#475569", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{h.is_government ? "Government" : "Private"}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#6b87b0" }}>{h.district}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12 }}>
                      <span style={{ background: h.trauma_level === "LEVEL_1" ? "#fef2f2" : "#fff7ed", color: h.trauma_level === "LEVEL_1" ? "#dc2626" : "#ea580c", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{h.trauma_level?.replace("_"," ")}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#0f2952" }}>{h.resources?.icu_beds_available ?? "—"}/{h.resources?.icu_beds_total ?? "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 50, height: 5, background: "#e8eef8", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${loadPct}%`, height: "100%", background: loadPct > 80 ? "#ef4444" : loadPct > 60 ? "#f59e0b" : "#10b981", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#6b87b0" }}>{loadPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: h.resources?.ot_available ? "#10b981" : "#ef4444", fontWeight: 600 }}>{h.resources?.ot_available ? "Ready" : "Busy"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: h.is_kasb_empaneled ? "#10b981" : "#9ca3af", fontWeight: 600 }}>{h.is_kasb_empaneled ? "Yes" : "No"}</td>
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
