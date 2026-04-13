import { useState, useEffect } from "react"
import { ambulancesApi, hospitalsApi } from "../../api/index"
import UserManagementPage from "./UserManagementPage"
import toast from "react-hot-toast"

const DISTRICTS = [
  "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", "Idukki", 
  "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
];

const EMPTY_HOSPITAL = {
  name: "", district: "Thiruvananthapuram", trauma_level: "LEVEL_2",
  is_government: false, is_kasb_empaneled: false,
  latitude: "", longitude: "",
  icu_beds_total: "", icu_beds_available: "", blood_bank_available: false,
}

const EMPTY_AMBULANCE = { registration_no: "", ambulance_type: "BLS", district: "Thiruvananthapuram", device_id: "" }

export function AdminPage() {
  const [hospitals, setHospitals] = useState<any[]>([])
  const [ambulances, setAmbulances] = useState<any[]>([])
  const [tab, setTab] = useState<"hospitals" | "ambulances" | "users">("hospitals")

  // Add Hospital State
  const [showAddHospital, setShowAddHospital] = useState(false)
  const [newHospital, setNewHospital] = useState({ ...EMPTY_HOSPITAL })
  const [isSubmittingHospital, setIsSubmittingHospital] = useState(false)

  // Add Ambulance State
  const [showAddAmbulance, setShowAddAmbulance] = useState(false)
  const [newAmbulance, setNewAmbulance] = useState({ ...EMPTY_AMBULANCE })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    hospitalsApi.getAll().then(r => setHospitals(Array.isArray(r.data) ? r.data : []))
    ambulancesApi.getAll().then(r => setAmbulances(Array.isArray(r.data) ? r.data : []))
  }, [])

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHospital.name.trim() || !newHospital.district) {
      toast.error("Hospital name and district are required")
      return
    }
    setIsSubmittingHospital(true)
    try {
      const payload = {
        name: newHospital.name.trim(),
        district: newHospital.district,
        trauma_level: newHospital.trauma_level,
        is_government: newHospital.is_government,
        is_kasb_empaneled: newHospital.is_kasb_empaneled,
        latitude: newHospital.latitude ? parseFloat(newHospital.latitude) : null,
        longitude: newHospital.longitude ? parseFloat(newHospital.longitude) : null,
        resources: {
          icu_beds_total: newHospital.icu_beds_total ? parseInt(newHospital.icu_beds_total) : 0,
          icu_beds_available: newHospital.icu_beds_available ? parseInt(newHospital.icu_beds_available) : 0,
          blood_bank_available: newHospital.blood_bank_available,
        }
      }
      const res = await hospitalsApi.create(payload)
      setHospitals(prev => [res.data, ...prev])
      setShowAddHospital(false)
      setNewHospital({ ...EMPTY_HOSPITAL })
      toast.success(`🏥 ${payload.name} added successfully`)
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to add hospital")
    } finally {
      setIsSubmittingHospital(false)
    }
  }

  const handleAddAmbulance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAmbulance.registration_no || !newAmbulance.district) {
      toast.error("Registration No. and District are required")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await ambulancesApi.create(newAmbulance)
      setAmbulances(prev => [res.data, ...prev])
      setShowAddAmbulance(false)
      setNewAmbulance({ ...EMPTY_AMBULANCE })
      toast.success("Ambulance added successfully")
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to add ambulance")
    } finally {
      setIsSubmitting(false)
    }
  }

  const setH = (field: string, value: any) => setNewHospital(prev => ({ ...prev, [field]: value }))

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
            <button onClick={() => setShowAddHospital(true)} className="btn btn-primary btn-sm">
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
            <button onClick={() => setShowAddAmbulance(true)} className="btn btn-primary btn-sm">
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
      {tab === "users" && <UserManagementPage />}

      {/* ── Add Hospital Modal ─────────────────────────────────────────── */}
      {showAddHospital && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, backdropFilter: "blur(4px)"
        }}>
          <div className="card" style={{ width: 520, maxWidth: "92vw", maxHeight: "90vh", overflow: "auto", padding: 24, animation: "modal-in 0.2s ease-out" }}>
            <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: 18, color: "var(--color-text-primary)" }}>🏥 Add New Hospital</h2>
            <p style={{ marginTop: 0, marginBottom: 20, fontSize: 12, color: "var(--color-text-secondary)" }}>
              Fill in the details — fields marked * are required
            </p>
            <form onSubmit={handleAddHospital} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Name */}
              <div>
                <label style={labelStyle}>Hospital Name *</label>
                <input
                  required type="text" placeholder="e.g. Government Medical College Palakkad"
                  className="input" style={{ width: "100%" }}
                  value={newHospital.name}
                  onChange={e => setH("name", e.target.value)}
                />
              </div>

              {/* District + Trauma Level */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>District *</label>
                  <select className="input" style={{ width: "100%" }} value={newHospital.district} onChange={e => setH("district", e.target.value)}>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Trauma Level</label>
                  <select className="input" style={{ width: "100%" }} value={newHospital.trauma_level} onChange={e => setH("trauma_level", e.target.value)}>
                    <option value="LEVEL_1">Level 1 — Major Trauma Centre</option>
                    <option value="LEVEL_2">Level 2 — Trauma Centre</option>
                    <option value="LEVEL_3">Level 3 — Trauma Facility</option>
                  </select>
                </div>
              </div>

              {/* Type toggles */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <ToggleField
                  label="Hospital Type"
                  checked={newHospital.is_government}
                  onChange={v => setH("is_government", v)}
                  onLabel="Government" offLabel="Private"
                  onColor="#3b82f6"
                />
                <ToggleField
                  label="KASB Empanelled"
                  checked={newHospital.is_kasb_empaneled}
                  onChange={v => setH("is_kasb_empaneled", v)}
                  onLabel="Yes" offLabel="No"
                  onColor="#10b981"
                />
              </div>

              {/* ICU Beds */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>ICU Beds (Total)</label>
                  <input type="number" min="0" placeholder="e.g. 20" className="input" style={{ width: "100%" }}
                    value={newHospital.icu_beds_total}
                    onChange={e => setH("icu_beds_total", e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>ICU Beds (Available)</label>
                  <input type="number" min="0" placeholder="e.g. 8" className="input" style={{ width: "100%" }}
                    value={newHospital.icu_beds_available}
                    onChange={e => setH("icu_beds_available", e.target.value)} />
                </div>
              </div>

              {/* Coordinates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Latitude (optional)</label>
                  <input type="number" step="any" placeholder="e.g. 10.5276" className="input" style={{ width: "100%" }}
                    value={newHospital.latitude}
                    onChange={e => setH("latitude", e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Longitude (optional)</label>
                  <input type="number" step="any" placeholder="e.g. 76.2144" className="input" style={{ width: "100%" }}
                    value={newHospital.longitude}
                    onChange={e => setH("longitude", e.target.value)} />
                </div>
              </div>

              {/* Blood bank */}
              <ToggleField
                label="Blood Bank"
                checked={newHospital.blood_bank_available}
                onChange={v => setH("blood_bank_available", v)}
                onLabel="Available" offLabel="Not Available"
                onColor="#ef4444"
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary"
                  onClick={() => { setShowAddHospital(false); setNewHospital({ ...EMPTY_HOSPITAL }) }}
                  disabled={isSubmittingHospital}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingHospital}>
                  {isSubmittingHospital ? "Adding…" : "Add Hospital"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Ambulance Modal ────────────────────────────────────────── */}
      {showAddAmbulance && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, backdropFilter: "blur(4px)"
        }}>
          <div className="card" style={{ width: 400, maxWidth: "90vw", padding: 24, animation: "modal-in 0.2s ease-out" }}>
            <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 18 }}>Add New Ambulance</h2>
            <form onSubmit={handleAddAmbulance} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Registration No. *</label>
                <input
                  required type="text" placeholder="e.g. KL-01-AB-1234"
                  className="input" style={{ width: "100%" }}
                  value={newAmbulance.registration_no}
                  onChange={e => setNewAmbulance({...newAmbulance, registration_no: e.target.value})}
                />
              </div>
              <div>
                <label style={labelStyle}>Ambulance Type</label>
                <select className="input" value={newAmbulance.ambulance_type}
                  onChange={e => setNewAmbulance({...newAmbulance, ambulance_type: e.target.value})}
                  style={{ width: "100%" }}>
                  <option value="BLS">BLS (Basic Life Support)</option>
                  <option value="ALS">ALS (Advanced Life Support)</option>
                  <option value="ICU">ICU (Intensive Care Unit)</option>
                  <option value="NEONATAL">Neonatal</option>
                  <option value="AIR">Air Ambulance</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>District</label>
                <select className="input" value={newAmbulance.district}
                  onChange={e => setNewAmbulance({...newAmbulance, district: e.target.value})}
                  style={{ width: "100%" }}>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Device ID (Optional)</label>
                <input type="text" placeholder="e.g. DEV-883"
                  className="input" style={{ width: "100%" }}
                  value={newAmbulance.device_id}
                  onChange={e => setNewAmbulance({...newAmbulance, device_id: e.target.value})}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary"
                  onClick={() => setShowAddAmbulance(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Ambulance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block", marginBottom: 5, fontSize: 11, fontWeight: 700,
  color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em",
}

function ToggleField({ label, checked, onChange, onLabel, offLabel, onColor }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
  onLabel: string; offLabel: string; onColor: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 10,
        padding: "8px 12px", background: "var(--color-bg-tertiary)",
        border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
        <div
          role="switch" aria-checked={checked}
          onClick={() => onChange(!checked)}
          style={{ width: 36, height: 20, borderRadius: 10, position: "relative", cursor: "pointer",
            background: checked ? onColor : "var(--color-border-strong)", transition: "background 0.2s", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: 2, width: 16, height: 16, borderRadius: "50%",
            background: "#fff", transition: "transform 0.2s",
            transform: checked ? "translateX(18px)" : "translateX(2px)" }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600,
          color: checked ? onColor : "var(--color-text-muted)" }}>
          {checked ? onLabel : offLabel}
        </span>
      </div>
    </div>
  )
}
