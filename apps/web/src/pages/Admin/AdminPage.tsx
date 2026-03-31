import { useState, useEffect } from "react"
import { ambulancesApi, hospitalsApi } from "../../api/index"
import { DevBanner } from "../../components/DevBanner"
import toast from "react-hot-toast"

export function AdminPage() {
  const [hospitals, setHospitals] = useState<any[]>([])
  const [ambulances, setAmbulances] = useState<any[]>([])
  const [tab, setTab] = useState<"hospitals"|"ambulances"|"users">("hospitals")

  useEffect(() => {
    hospitalsApi.getAll().then(r => setHospitals(Array.isArray(r.data) ? r.data : []))
    ambulancesApi.getAll().then(r => setAmbulances(Array.isArray(r.data) ? r.data : []))
  }, [])

  return (
    <div style={{ padding: 24, fontFamily: "Arial", color: "#f1f5f9" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>System Administration</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Manage hospitals, ambulances, users and alert rules</p>
      </div>
      <DevBanner feature="Role-Based User Management" description="Create and manage users across all roles: Paramedic, Dispatcher, Hospital Staff, Government. Assign ambulances and hospitals." progress={55} eta="Q2 2026" />
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["hospitals","ambulances","users"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", background: tab === t ? "#10b981" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8", border: "1px solid #334155", borderRadius: 6, cursor: "pointer", fontSize: 13, textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>
      {tab === "hospitals" && (
        <div style={{ background: "#111827", borderRadius: 8, border: "1px solid #1f2937", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", background: "#1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Registered Hospitals ({hospitals.length})</span>
            <button onClick={() => toast("Add Hospital form coming soon")} style={{ padding: "6px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>+ Add Hospital</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#0f172a" }}>{["Name","District","Level","ICU","KASB","Govt"].map(h => <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, color: "#64748b" }}>{h}</th>)}</tr></thead>
            <tbody>
              {hospitals.map((h: any) => (
                <tr key={h.id} style={{ borderTop: "1px solid #1f2937" }}>
                  <td style={{ padding: "8px 14px", fontSize: 13 }}>{h.name}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "#94a3b8" }}>{h.district}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12 }}><span style={{ background: h.trauma_level === "LEVEL_1" ? "#ef444422" : "#f59e0b22", color: h.trauma_level === "LEVEL_1" ? "#ef4444" : "#f59e0b", padding: "1px 6px", borderRadius: 4 }}>{h.trauma_level?.replace("_"," ")}</span></td>
                  <td style={{ padding: "8px 14px", fontSize: 12 }}>{h.resources?.icu_beds_available ?? "—"}/{h.resources?.icu_beds_total ?? "—"}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: h.is_kasb_empaneled ? "#10b981" : "#ef4444" }}>{h.is_kasb_empaneled ? "Yes" : "No"}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: h.is_government ? "#3b82f6" : "#64748b" }}>{h.is_government ? "Govt" : "Private"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "ambulances" && (
        <div style={{ background: "#111827", borderRadius: 8, border: "1px solid #1f2937", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", background: "#1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Ambulance Fleet ({ambulances.length})</span>
            <button onClick={() => toast("Add Ambulance form coming soon")} style={{ padding: "6px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>+ Add Ambulance</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#0f172a" }}>{["Reg No","Type","District","Status","Device"].map(h => <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, color: "#64748b" }}>{h}</th>)}</tr></thead>
            <tbody>
              {ambulances.map((a: any) => (
                <tr key={a.id} style={{ borderTop: "1px solid #1f2937" }}>
                  <td style={{ padding: "8px 14px", fontSize: 13, color: "#38bdf8" }}>{a.registration_no}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12 }}>{a.ambulance_type}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "#94a3b8" }}>{a.district}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12 }}><span style={{ background: a.status === "AVAILABLE" ? "#10b98122" : "#f59e0b22", color: a.status === "AVAILABLE" ? "#10b981" : "#f59e0b", padding: "1px 6px", borderRadius: 4 }}>{a.status}</span></td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "#64748b" }}>{a.device_id || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "users" && (
        <div style={{ padding: 32, textAlign: "center", background: "#111827", borderRadius: 8, border: "1px solid #1f2937" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
          <p style={{ color: "#64748b", fontSize: 14 }}>User management interface is currently in development.</p>
          <DevBanner feature="User Management" description="Create paramedic, dispatcher, hospital staff, and government accounts with role-based access." progress={40} eta="Q2 2026" />
        </div>
      )}
    </div>
  )
}
