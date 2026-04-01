import { useState, useEffect } from "react"
import { ambulancesApi, hospitalsApi } from "../../api/index"
import { DevBanner } from "../../components/DevBanner"
import toast from "react-hot-toast"

export function AdminPage() {
  const [hospitals, setHospitals] = useState<any[]>([])
  const [ambulances, setAmbulances] = useState<any[]>([])
  const [tab, setTab] = useState<"hospitals" | "ambulances" | "users">("hospitals")

  useEffect(() => {
    hospitalsApi.getAll().then(r => setHospitals(Array.isArray(r.data) ? r.data : []))
    ambulancesApi.getAll().then(r => setAmbulances(Array.isArray(r.data) ? r.data : []))
  }, [])

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>
          System Administration
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 13, margin: "4px 0 0" }}>
          Manage hospitals, ambulances, users and alert rules
        </p>
      </div>

      <DevBanner
        feature="Role-Based User Management"
        description="Create and manage users across all roles: Paramedic, Dispatcher, Hospital Staff, Government."
        progress={55}
        eta="Q2 2026"
      />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["hospitals", "ambulances", "users"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`btn ${tab === t ? "btn-primary" : "btn-secondary"}`}
            style={{ textTransform: "capitalize", borderRadius: "99px", padding: "7px 16px" }}
          >
            {t}
            {t === "hospitals" && ` (${hospitals.length})`}
            {t === "ambulances" && ` (${ambulances.length})`}
          </button>
        ))}
      </div>

      {/* Hospitals Tab */}
      {tab === "hospitals" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-tertiary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
              Registered Hospitals
            </span>
            <button onClick={() => toast("Add Hospital form coming soon")} className="btn btn-primary btn-sm">
              + Add Hospital
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  {["Name","District","Level","ICU","KASB Empanelled","Type"].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {hospitals.map((h: any) => (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{h.name}</td>
                    <td style={{ color: "var(--color-text-secondary)" }}>{h.district}</td>
                    <td>
                      <span className={`badge ${h.trauma_level === "LEVEL_1" ? "badge-info" : "badge-secondary"}`}>
                        {h.trauma_level?.replace("_"," ")}
                      </span>
                    </td>
                    <td className="mono">
                      {h.resources?.icu_beds_available ?? "—"}/{h.resources?.icu_beds_total ?? "—"}
                    </td>
                    <td>
                      <span className={`badge ${h.is_kasb_empaneled ? "badge-success" : "badge-muted"}`}>
                        {h.is_kasb_empaneled ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${h.is_government ? "badge-info" : "badge-secondary"}`}>
                        {h.is_government ? "Govt" : "Private"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ambulances Tab */}
      {tab === "ambulances" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-tertiary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
              Ambulance Fleet
            </span>
            <button onClick={() => toast("Add Ambulance form coming soon")} className="btn btn-primary btn-sm">
              + Add Ambulance
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  {["Reg No","Type","District","Status","Device ID"].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {ambulances.map((a: any) => (
                  <tr key={a.id}>
                    <td className="mono" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{a.registration_no}</td>
                    <td style={{ color: "var(--color-text-secondary)" }}>{a.ambulance_type}</td>
                    <td style={{ color: "var(--color-text-secondary)" }}>{a.district}</td>
                    <td>
                      <span className={`badge ${a.status === "AVAILABLE" ? "badge-success" : a.status === "ON_SCENE" ? "badge-danger" : "badge-warning"}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="mono" style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{a.device_id || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === "users" && (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>👥</div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 20 }}>
            User management interface is currently in development.
          </p>
          <DevBanner
            feature="User Management"
            description="Create paramedic, dispatcher, hospital staff, and government accounts with role-based access."
            progress={40}
            eta="Q2 2026"
          />
        </div>
      )}
    </div>
  )
}
