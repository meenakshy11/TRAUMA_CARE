import { useNavigate } from "react-router-dom"
import React, { useEffect, useState } from "react"
import { useDistrictStore } from "../../store/districtStore"
import { hospitalsApi } from "../../api/index"

export function HospitalListPage() {
  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
  const [bloodGroup, setBloodGroup] = React.useState("")
  const [bloodResults, setBloodResults] = React.useState<any[]>([])
  const [bloodSearching, setBloodSearching] = React.useState(false)

  const searchByBloodGroup = async (bg: string) => {
    if (!bg) { setBloodResults([]); return }
    setBloodSearching(true)
    try {
      const r = await bloodStockApi.searchByBloodGroup(bg)
      setBloodResults(Array.isArray(r.data) ? r.data : [])
    } finally {
      setBloodSearching(false)
    }
  }
  const { selectedDistrict } = useDistrictStore()
  const navigate = useNavigate()
  const [hospitals, setHospitals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")

  useEffect(() => {
    hospitalsApi.getAll({ district: selectedDistrict || undefined }).then(r => {
      setHospitals(Array.isArray(r.data) ? r.data : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [selectedDistrict])

  const filtered = filter === "ALL"
    ? hospitals
    : hospitals.filter(h => h.trauma_level === filter || (filter === "AVAILABLE" && h.resources?.icu_beds_available > 0))

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--color-border)" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>
            Trauma Center Network
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 13, margin: "4px 0 0" }}>
            Statewide hospital registry — click a row to view details
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["ALL","LEVEL_1","LEVEL_2","AVAILABLE"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`btn ${filter === s ? "btn-primary" : "btn-secondary"}`}
              style={{ borderRadius: "99px", padding: "6px 14px" }}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--color-text-muted)" }}>
            <div className="spinner" style={{ marginBottom: 16, borderColor: "var(--color-text-muted)", borderTopColor: "var(--color-accent-blue)", width: 32, height: 32 }} />
            <div>Loading hospitals...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--color-text-muted)" }}>
            No hospitals found matching criteria.
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hospital Name</th>
                  <th>Level</th>
                  <th>District</th>
                  <th style={{ textAlign: "center" }}>ICU Beds</th>
                  <th style={{ textAlign: "center" }}>Ventilators</th>
                  <th style={{ textAlign: "center" }}>Blood Bank</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(h => {
                  const icuAvail = h.resources?.icu_beds_available || 0
                  const icuTotal = h.resources?.icu_beds_total || 0
                  const ventAvail = h.resources?.ventilators_available || 0

                  return (
                    <tr
                      key={h.id}
                      onClick={() => navigate(`/hospitals/${h.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{h.name}</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>{h.address || "—"}</div>
                      </td>
                      <td>
                        <span className={`badge ${h.trauma_level === "LEVEL_1" ? "badge-info" : "badge-secondary"}`}>
                          {h.trauma_level?.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ color: "var(--color-text-secondary)" }}>{h.district}</td>
                      <td style={{ textAlign: "center", width: "120px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: icuAvail > 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                            {icuAvail}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>/ {icuTotal}</span>
                        </div>
                      </td>
                      <td className="mono" style={{ textAlign: "center", color: "var(--color-text-primary)", fontWeight: 600 }}>
                        {ventAvail}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {h.resources?.blood_bank_available ? (
                          <span style={{ color: "var(--color-success)", fontSize: 16 }}>●</span>
                        ) : (
                          <span style={{ color: "var(--color-danger)", fontSize: 16 }}>●</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${icuAvail > 0 ? "badge-success" : "badge-danger"}`}>
                          {icuAvail > 0 ? "ACCEPTING" : "FULL"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
