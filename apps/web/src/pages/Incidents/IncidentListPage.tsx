import { useEffect, useState } from "react"
import { useDistrictStore } from "../../store/districtStore"
import { useNavigate } from "react-router-dom"
import { incidentsApi } from "../../api/index"
import StatusBadge from "../../components/StatusBadge"
import styles from "./IncidentListPage.module.css"

export function IncidentListPage() {
  const navigate = useNavigate()
  const { selectedDistrict } = useDistrictStore()
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    incidentsApi.getAll({ district: selectedDistrict || undefined }).then(r => {
      setIncidents(Array.isArray(r.data) ? r.data : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [selectedDistrict])

  const filtered = incidents.filter(i => {
    if (filter !== "ALL" && i.status !== filter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return i.incident_number?.toLowerCase().includes(q) ||
             i.district?.toLowerCase().includes(q) ||
             i.accident_type?.toLowerCase().includes(q)
    }
    return true
  })

  // Priority sort: CRITICAL first, then by date descending
  const sorted = [...filtered].sort((a, b) => {
    if (a.severity === "CRITICAL" && b.severity !== "CRITICAL") return -1
    if (b.severity === "CRITICAL" && a.severity !== "CRITICAL") return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div>
      <div className={styles.filters}>
        <div className={styles.titleBox}>
          <h1>Incident Registry</h1>
          <p>All trauma incidents &mdash; centralized record</p>
        </div>
        <div className={styles.toggleGroup}>
          {["ALL","REPORTED","DISPATCHED","ON_SCENE","CLOSED"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`${styles.toggleBtn} ${filter === s ? styles.toggleActive : ""}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.topBar}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Search by ID, Type, or District..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            Showing {sorted.length} incident{sorted.length !== 1 ? "s" : ""}
          </div>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <div className="spinner" style={{ marginBottom: 16, borderColor: "var(--color-text-muted)", borderTopColor: "var(--color-accent-blue)", width: 24, height: 24 }}></div>
            <div className={styles.emptyText}>Loading incidents...</div>
          </div>
        ) : sorted.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>No results</div>
            <div className={styles.emptyText}>No incidents found</div>
            <div className={styles.emptySub}>Try adjusting your search or filters.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Incident #</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>District</th>
                  <th>Patients</th>
                  <th>Status</th>
                  <th>Time reported</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((inc: any) => (
                  <tr
                    key={inc.id}
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    style={{ borderLeft: inc.severity === "CRITICAL" ? "3px solid var(--color-danger)" : "3px solid transparent", cursor: "pointer" }}
                  >
                    <td className="mono" style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{inc.incident_number}</td>
                    <td>{inc.accident_type?.replace(/_/g," ") || "—"}</td>
                    <td>
                      <span className={`badge ${inc.severity === "CRITICAL" ? "badge-critical" : inc.severity === "SEVERE" ? "badge-warning" : "badge-info"}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td style={{ color: "var(--color-text-secondary)" }}>{inc.district || "—"}</td>
                    <td className="mono" style={{ textAlign: "center" }}>{inc.patient_count}</td>
                    <td><StatusBadge status={inc.status} /></td>
                    <td className="mono" style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
                      {inc.created_at ? new Date(inc.created_at).toLocaleTimeString("en-IN", { hour12: false }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
