import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useCallback } from "react"
import { incidentsApi } from "../../api/index"
import { DEMO_AMBULANCES, DEMO_HOSPITALS } from "../../api/demo-fixtures"
import { generateMockPatients, generateMockTimeline } from "./mockDataGenerators"
import { IncidentMap } from "./components/IncidentMap"
import StatusBadge from "../../components/StatusBadge"
import toast from "react-hot-toast"

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_FLOW = [
  "REPORTED", "DISPATCH_PENDING", "DISPATCHED", "EN_ROUTE",
  "ON_SCENE", "PATIENT_LOADED", "TRANSPORTING", "HOSPITAL_ARRIVED", "CLOSED",
]

const SEVERITY_BADGE_CLASS: Record<string, string> = {
  CRITICAL: "badge-critical",
  SEVERE:   "badge-warning",
  MODERATE: "badge-info",
  MINOR:    "badge-success",
}

const TRIAGE_META: Record<string, { label: string; color: string }> = {
  RED:    { label: "Immediate",  color: "var(--color-danger)" },
  YELLOW: { label: "Delayed",   color: "var(--color-warning)" },
  GREEN:  { label: "Minor",     color: "var(--color-success)" },
  BLACK:  { label: "Expectant", color: "var(--color-text-muted)" },
}

const STATUS_DOT: Record<string, string> = {
  REPORTED:         "var(--color-warning)",
  DISPATCH_PENDING: "#fb923c",
  DISPATCHED:       "var(--color-accent-blue)",
  EN_ROUTE:         "#8b5cf6",
  ON_SCENE:         "var(--color-accent-cyan)",
  PATIENT_LOADED:   "var(--color-warning)",
  TRANSPORTING:     "var(--color-success)",
  HOSPITAL_ARRIVED: "#6ee7b7",
  CLOSED:           "var(--color-text-muted)",
}

const AGENT_ICON: Record<string, string> = {
  "Public Reporter":    "🧑",
  "System Engine":      "⚙️",
  "Dispatcher Command": "🎛",
  "Paramedic Tablet":   "📱",
  "Hospital Dashboard": "🏥",
}

// ─── Live Golden Hour Timer ───────────────────────────────────────────────────
function GoldenHourBadge({ createdAt, goldenHourMet }: { createdAt: string; goldenHourMet: boolean | null }) {
  const [elapsed, setElapsed] = useState(0)
  const GOLDEN = 3600

  useEffect(() => {
    const t0 = new Date(createdAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - t0) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [createdAt])

  if (goldenHourMet !== null) {
    return (
      <span className={`badge ${goldenHourMet ? "badge-success" : "badge-critical"}`} style={{ fontSize: 13, padding: "6px 14px" }}>
        {goldenHourMet ? "✅ Golden Hour Met" : "❌ Golden Hour Missed"}
      </span>
    )
  }

  const remaining = GOLDEN - elapsed
  const expired = remaining <= 0
  const disp = Math.abs(remaining)
  const mm = String(Math.floor(disp / 60)).padStart(2, "0")
  const ss = String(disp % 60).padStart(2, "0")
  const cls = expired ? "badge-critical" : remaining < 600 ? "badge-warning" : "badge-success"

  return (
    <span className={`badge ${cls}`} style={{ fontSize: 13, padding: "6px 14px", fontFamily: "var(--font-mono)" }}>
      ⏱ {expired ? `+${mm}:${ss} EXPIRED` : `${mm}:${ss} remaining`}
    </span>
  )
}

// ─── Status Advance Modal ─────────────────────────────────────────────────────
function AdvanceModal({
  incident, nextStatus, onConfirm, onCancel,
}: { incident: any; nextStatus: string; onConfirm: (note: string) => Promise<void>; onCancel: () => void }) {
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    await onConfirm(note)
    setBusy(false)
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{ padding: 28, width: "100%", maxWidth: 440, boxShadow: "var(--shadow-elevated)" }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 16 }}>
          Advance Incident Status
        </div>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 16px" }}>
          Changing <span className="mono" style={{ color: "var(--color-text-primary)" }}>{incident.incident_number}</span>{" "}
          from <strong>{incident.status?.replace(/_/g, " ")}</strong> →{" "}
          <strong style={{ color: "var(--color-accent-blue)" }}>{nextStatus.replace(/_/g, " ")}</strong>
        </p>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
          Note (optional)
        </label>
        <textarea
          rows={3}
          placeholder="Add a note for the activity log…"
          value={note}
          onChange={e => setNote(e.target.value)}
          style={{
            width: "100%", background: "var(--color-bg-primary)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13,
            padding: "10px 12px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={confirm} disabled={busy}>
            {busy ? "Saving…" : `Mark as ${nextStatus.replace(/_/g, " ")}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function IncidentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [incident, setIncident] = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [tab,      setTab]      = useState<"timeline" | "patients" | "dispatch">("timeline")

  const load = useCallback(async () => {
    if (!id) return
    try {
      const res = await incidentsApi.getOne(id)
      setIncident(res.data)
    } catch {
      setIncident(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleAdvance = async (note: string) => {
    if (!incident) return
    const next = STATUS_FLOW[STATUS_FLOW.indexOf(incident.status) + 1]
    if (!next) return
    try {
      await incidentsApi.updateStatus(incident.id, next, note)
      setIncident((p: any) => ({ ...p, status: next }))
      toast.success(`Status → ${next.replace(/_/g, " ")}`)
    } catch {
      toast.error("Failed to update status")
    }
    setModal(false)
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 16, color: "var(--color-text-muted)" }}>
        <div className="spinner" style={{ width: 32, height: 32, borderColor: "var(--color-text-muted)", borderTopColor: "var(--color-accent-blue)" }} />
        <div style={{ fontSize: 14 }}>Loading incident…</div>
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (!incident) {
    return (
      <div style={{ textAlign: "center", padding: 64, color: "var(--color-text-muted)" }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🔍</div>
        <div style={{ fontSize: 16, color: "var(--color-text-primary)" }}>Incident Not Found</div>
        <button onClick={() => navigate("/incidents")} className="btn btn-secondary" style={{ marginTop: 16 }}>
          ← Back to Incidents
        </button>
      </div>
    )
  }

  // ── Derived / enriched data ──────────────────────────────────────────────
  const patients = generateMockPatients(incident)
  const timeline = generateMockTimeline(incident)
  const nextIdx  = STATUS_FLOW.indexOf(incident.status) + 1
  const nextStatus = nextIdx < STATUS_FLOW.length ? STATUS_FLOW[nextIdx] : null
  const assignedAmb  = DEMO_AMBULANCES.find(a => a.district === incident.district) || DEMO_AMBULANCES[0]
  const nearestHosp  = DEMO_HOSPITALS.find(h => h.district === incident.district) || DEMO_HOSPITALS[0]
  const isMCI = (incident.patient_count || patients.length) >= 3

  const dispatchRecord = {
    ambulance: `${assignedAmb.registration_no} (${assignedAmb.ambulance_type})`,
    hospital: nearestHosp.name,
    dispatched_at:      new Date(new Date(incident.created_at).getTime() + 3  * 60000).toISOString(),
    scene_arrived_at:   new Date(new Date(incident.created_at).getTime() + 11 * 60000).toISOString(),
    transport_started_at: new Date(new Date(incident.created_at).getTime() + 28 * 60000).toISOString(),
    response_time_sec: 8 * 60,
  }

  // triage counts
  const triageCounts: Record<string, number> = { RED: 0, YELLOW: 0, GREEN: 0, BLACK: 0 }
  patients.forEach(p => { triageCounts[p.triage_color] = (triageCounts[p.triage_color] || 0) + 1 })

  const TABS = [
    { key: "timeline"  as const, label: "Timeline",       count: timeline.length },
    { key: "patients"  as const, label: "Patients",       count: patients.length },
    { key: "dispatch"  as const, label: "Dispatch Record" },
  ]

  return (
    <div>
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <button
          onClick={() => navigate("/incidents")}
          style={{
            background: "transparent", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)", color: "var(--color-text-secondary)",
            cursor: "pointer", padding: "6px 12px", fontSize: 13,
            transition: "all var(--transition-fast)", flexShrink: 0,
          }}
        >
          ← Back
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
            <h1 className="mono" style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--color-text-primary)" }}>
              {incident.incident_number}
            </h1>
            <span className={`badge ${SEVERITY_BADGE_CLASS[incident.severity] || "badge-info"}`}>
              {incident.severity}
            </span>
            <StatusBadge status={incident.status} />
            {isMCI && (
              <span className="badge badge-critical" style={{ animation: "pulse-ring 2s ease-in-out infinite" }}>
                MCI
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            {incident.accident_type?.replace(/_/g, " ") || "Incident"} ·{" "}
            {incident.district} ·{" "}
            {new Date(incident.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
          <GoldenHourBadge createdAt={incident.created_at} goldenHourMet={incident.golden_hour_met ?? null} />
          {nextStatus && (
            <button
              className="btn btn-primary"
              style={{ fontSize: 12 }}
              onClick={() => setModal(true)}
            >
              → {nextStatus.replace(/_/g, " ")}
            </button>
          )}
          <a
            href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
            target="_blank" rel="noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)", background: "transparent",
              color: "var(--color-text-secondary)", fontSize: 12, textDecoration: "none",
              transition: "all var(--transition-fast)",
            }}
          >
            🗺 Maps
          </a>
        </div>
      </div>

      {/* ── KPI Strip ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Type",           value: (incident.accident_type || "UNKNOWN").replace(/_/g, " "), color: "var(--color-text-primary)" },
          { label: "District",       value: incident.district,                                        color: "var(--color-text-primary)" },
          { label: "Patients",       value: String(incident.patient_count || patients.length),        color: "var(--color-accent-cyan)" },
          { label: "Response Time",  value: "8 min",                                                  color: "var(--color-success)" },
          { label: "Ambulance",      value: assignedAmb.registration_no,                              color: "var(--color-text-primary)" },
          { label: "Hospital",       value: nearestHosp.name.split(" ").slice(0, 2).join(" "),        color: "var(--color-accent-blue)" },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
              {c.label}
            </div>
            <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: c.color, lineHeight: 1.2 }}>
              {c.value || "—"}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid: Left + Right ────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "start" }}>

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Map */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-tertiary)" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                📍 Location
              </span>
            </div>
            <div style={{ padding: 16 }}>
              <IncidentMap latitude={incident.latitude} longitude={incident.longitude} />
              <div className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 8, textAlign: "center" }}>
                {incident.latitude?.toFixed(5)}, {incident.longitude?.toFixed(5)}
              </div>
            </div>
          </div>

          {/* Incident Details */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-tertiary)" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Incident Details
              </span>
            </div>
            <div style={{ padding: "12px 20px" }}>
              {[
                ["Status",       <StatusBadge key="s" status={incident.status} />],
                ["Severity",     <span key="sev" className={`badge ${SEVERITY_BADGE_CLASS[incident.severity] || "badge-info"}`}>{incident.severity}</span>],
                ["Type",         (incident.accident_type || "—").replace(/_/g, " ")],
                ["District",     incident.district],
                ["Patient Count",String(incident.patient_count || patients.length)],
                ["Reporter",     incident.reporter_name || "Anonymous"],
                ["Golden Hour",  incident.golden_hour_met === null ? "Pending" : incident.golden_hour_met ? "✅ Met" : "❌ Missed"],
                ["Coordinates",  `${incident.latitude?.toFixed(5)}, ${incident.longitude?.toFixed(5)}`],
              ].map(([label, val]) => (
                <div key={label as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--color-border)", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--color-text-secondary)", flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", textAlign: "right" }}>{val || "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Triage Summary */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-tertiary)" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🩹 Triage Summary
              </span>
            </div>
            <div style={{ padding: "12px 20px" }}>
              {["RED", "YELLOW", "GREEN", "BLACK"].map(color => {
                const count = triageCounts[color] || 0
                const meta  = TRIAGE_META[color]
                return (
                  <div key={color} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: count > 0 ? meta.color : "var(--color-border-strong)" }} />
                      <span style={{ fontSize: 13, color: count > 0 ? meta.color : "var(--color-text-muted)", fontWeight: 600 }}>{color}</span>
                      <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{meta.label}</span>
                    </div>
                    <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: count > 0 ? meta.color : "var(--color-text-muted)" }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Tabbed panel: Timeline / Patients / Dispatch */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-tertiary)" }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{
                    flex: "none", padding: "12px 20px", background: "transparent", border: "none",
                    borderBottom: tab === t.key ? "2px solid var(--color-accent-blue)" : "2px solid transparent",
                    color: tab === t.key ? "var(--color-text-primary)" : "var(--color-text-muted)",
                    fontSize: 13, fontWeight: tab === t.key ? 600 : 400, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
                  }}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, minWidth: 20, textAlign: "center",
                      background: tab === t.key ? "var(--color-accent-blue)" : "var(--color-bg-hover)",
                      color: tab === t.key ? "#fff" : "var(--color-text-muted)",
                    }}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Timeline tab ── */}
            {tab === "timeline" && (
              <div style={{ padding: 20 }}>
                {timeline.length === 0 ? (
                  <div style={{ color: "var(--color-text-muted)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No timeline entries yet</div>
                ) : (
                  <div style={{ position: "relative", paddingLeft: 24 }}>
                    <div style={{ position: "absolute", left: 9, top: 8, bottom: 8, width: 2, background: "var(--color-border)" }} />
                    {timeline.map((t: any, i: number) => {
                      const color = STATUS_DOT[t.status] || "var(--color-text-muted)"
                      const isLatest = i === 0
                      return (
                        <div key={t.id} style={{ display: "flex", gap: 12, marginBottom: 16, position: "relative" }}>
                          <div style={{
                            width: 12, height: 12, borderRadius: "50%",
                            background: isLatest ? color : "var(--color-bg-tertiary)",
                            border: `2px solid ${color}`,
                            flexShrink: 0, marginTop: 3, zIndex: 1,
                            boxShadow: isLatest ? `0 0 0 4px ${color}22` : "none",
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color }}>{t.status.replace(/_/g, " ")}</div>
                              <div className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)", flexShrink: 0 }}>
                                {new Date(t.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                              {AGENT_ICON[t.agent] || "📋"} {t.agent}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Patients tab ── */}
            {tab === "patients" && (
              <div>
                {patients.length === 0 ? (
                  <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
                    No patients recorded for this incident
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Demographics</th>
                          <th>Triage</th>
                          <th>GCS</th>
                          <th>HR</th>
                          <th>BP</th>
                          <th>SpO2</th>
                          <th>Injury</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patients.map((p: any, i: number) => {
                          const meta = TRIAGE_META[p.triage_color] || { label: "Unknown", color: "var(--color-text-muted)" }
                          return (
                            <tr key={p.id} style={{ borderLeft: `3px solid ${meta.color}` }}>
                              <td className="mono" style={{ color: "var(--color-text-muted)" }}>{i + 1}</td>
                              <td style={{ fontWeight: 600 }}>{p.demographics}</td>
                              <td>
                                <span style={{
                                  fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 700,
                                  background: `${meta.color}22`, color: meta.color,
                                }}>
                                  {p.triage_color} · {meta.label}
                                </span>
                              </td>
                              <td className="mono">{p.vitals.gcs}</td>
                              <td className="mono">{p.vitals.hr}</td>
                              <td className="mono">{p.vitals.bp}</td>
                              <td className="mono">{p.vitals.spo2}%</td>
                              <td style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{p.injury_description}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Dispatch tab ── */}
            {tab === "dispatch" && (
              <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { label: "Ambulance",    value: dispatchRecord.ambulance },
                    { label: "Hospital",     value: dispatchRecord.hospital },
                  ].map(r => (
                    <div key={r.label} className="card" style={{ padding: "12px 16px", background: "var(--color-bg-tertiary)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{r.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{r.value}</div>
                    </div>
                  ))}
                </div>
                {[
                  { label: "Dispatched At",      value: new Date(dispatchRecord.dispatched_at).toLocaleTimeString("en-IN") },
                  { label: "Scene Arrived",       value: new Date(dispatchRecord.scene_arrived_at).toLocaleTimeString("en-IN") },
                  { label: "Transport Started",   value: new Date(dispatchRecord.transport_started_at).toLocaleTimeString("en-IN") },
                  { label: "Response Time",       value: `${Math.round(dispatchRecord.response_time_sec / 60)} min`, highlight: true },
                  { label: "Scene Time (est)",    value: "17 min" },
                  { label: "Transport Time (est)",value: "22 min" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{r.label}</span>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: r.highlight ? "var(--color-success)" : "var(--color-text-primary)" }}>
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Patient Vitals cards */}
          {patients.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-tertiary)" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  💊 Patient Vitals
                </span>
              </div>
              <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {patients.map((p: any, i: number) => {
                  const meta = TRIAGE_META[p.triage_color] || { label: "Unknown", color: "var(--color-text-muted)" }
                  return (
                    <div key={p.id} style={{
                      padding: 14, borderRadius: "var(--radius-sm)",
                      border: `1px solid ${meta.color}44`,
                      background: `${meta.color}0a`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>Patient {i + 1} · {p.demographics}</span>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 700, background: `${meta.color}22`, color: meta.color }}>{p.triage_color}</span>
                      </div>
                      <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--color-text-secondary)", flexWrap: "wrap" }}>
                        <span>GCS <strong className="mono" style={{ color: "var(--color-text-primary)" }}>{p.vitals.gcs}</strong></span>
                        <span>HR <strong className="mono" style={{ color: "var(--color-text-primary)" }}>{p.vitals.hr}</strong></span>
                        <span>BP <strong className="mono" style={{ color: "var(--color-text-primary)" }}>{p.vitals.bp}</strong></span>
                        <span>SpO2 <strong className="mono" style={{ color: "var(--color-text-primary)" }}>{p.vitals.spo2}%</strong></span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 6, fontStyle: "italic" }}>{p.injury_description}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Status Advance Modal ────────────────────────────────────────── */}
      {modal && nextStatus && (
        <AdvanceModal
          incident={incident}
          nextStatus={nextStatus}
          onConfirm={handleAdvance}
          onCancel={() => setModal(false)}
        />
      )}
    </div>
  )
}
