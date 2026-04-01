import { useState, useEffect } from "react"
import { ambulancesApi, hospitalsApi } from "../../api/index"
import toast from "react-hot-toast"

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

export function AdminPage() {
  const [hospitals, setHospitals] = useState<any[]>([])
  const [ambulances, setAmbulances] = useState<any[]>([])
  const [tab, setTab] = useState<"hospitals"|"ambulances"|"users">("hospitals")
  useEffect(() => {
    hospitalsApi.getAll().then(r => setHospitals(Array.isArray(r.data) ? r.data : []))
    ambulancesApi.getAll().then(r => setAmbulances(Array.isArray(r.data) ? r.data : []))
  }, [])

  return (
    <div style={{ padding: 24, background: "#f0f4ff", minHeight: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f2952" }}>System Administration</h1>
        <p style={{ color: "#6b87b0", fontSize: 13, margin: "4px 0 0" }}>Manage hospitals, ambulances, users and alert rules</p>
      </div>
      <DevBanner feature="Role-Based User Management" description="Create and manage users across all roles: Paramedic, Dispatcher, Hospital Staff, Government." progress={55} eta="Q2 2026" />
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["hospitals","ambulances","users"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", background: tab === t ? "#1a3a6b" : "#ffffff", color: tab === t ? "#fff" : "#2d5086", border: "1px solid #c8d8f0", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 600 : 400, textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>
      {tab === "hospitals" && (
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #c8d8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "10px 14px", background: "#f0f4ff", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #c8d8f0" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f2952" }}>Registered Hospitals ({hospitals.length})</span>
            <button onClick={() => toast("Add Hospital form coming soon")} style={{ padding: "6px 12px", background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ Add Hospital</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f8faff" }}>{["Name","District","Level","ICU","KASB","Type"].map(h => <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 12, color: "#6b87b0", fontWeight: 600, borderBottom: "1px solid #e8eef8" }}>{h}</th>)}</tr></thead>
            <tbody>
              {hospitals.map((h: any) => (
                <tr key={h.id} style={{ borderTop: "1px solid #e8eef8" }}>
                  <td style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#0f2952" }}>{h.name}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "#6b87b0" }}>{h.district}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12 }}><span style={{ background: h.trauma_level === "LEVEL_1" ? "#fef2f2" : "#fff7ed", color: h.trauma_level === "LEVEL_1" ? "#dc2626" : "#ea580c", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{h.trauma_level?.replace("_"," ")}</span></td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "#0f2952" }}>{h.resources?.icu_beds_available ?? "—"}/{h.resources?.icu_beds_total ?? "—"}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: h.is_kasb_empaneled ? "#10b981" : "#ef4444", fontWeight: 600 }}>{h.is_kasb_empaneled ? "Yes" : "No"}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12 }}><span style={{ background: h.is_government ? "#dbeafe" : "#f1f5f9", color: h.is_government ? "#1d4ed8" : "#475569", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{h.is_government ? "Govt" : "Private"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "ambulances" && (
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #c8d8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "10px 14px", background: "#f0f4ff", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #c8d8f0" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f2952" }}>Ambulance Fleet ({ambulances.length})</span>
            <button onClick={() => toast("Add Ambulance form coming soon")} style={{ padding: "6px 12px", background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ Add Ambulance</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f8faff" }}>{["Reg No","Type","District","Status","Device"].map(h => <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 12, color: "#6b87b0", fontWeight: 600, borderBottom: "1px solid #e8eef8" }}>{h}</th>)}</tr></thead>
            <tbody>
              {ambulances.map((a: any) => (
                <tr key={a.id} style={{ borderTop: "1px solid #e8eef8" }}>
                  <td style={{ padding: "8px 14px", fontSize: 13, color: "#1a3a6b", fontWeight: 600 }}>{a.registration_no}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "#0f2952" }}>{a.ambulance_type}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "#6b87b0" }}>{a.district}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12 }}><span style={{ background: a.status === "AVAILABLE" ? "#f0fdf4" : "#fffbeb", color: a.status === "AVAILABLE" ? "#16a34a" : "#d97706", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{a.status}</span></td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "#9ca3af" }}>{a.device_id || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "users" && (
        <div style={{ padding: 32, textAlign: "center", background: "#ffffff", borderRadius: 8, border: "1px solid #c8d8f0" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
          <p style={{ color: "#6b87b0", fontSize: 14, marginBottom: 16 }}>User management interface is currently in development.</p>
          <DevBanner feature="User Management" description="Create paramedic, dispatcher, hospital staff, and government accounts with role-based access." progress={40} eta="Q2 2026" />
        </div>
      )}
    </div>
  )
}
