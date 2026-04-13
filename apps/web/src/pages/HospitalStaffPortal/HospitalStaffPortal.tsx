import { useState, useEffect, useCallback } from "react"
import { useAuthStore } from "../../store/authStore"
import { useHospitalStore } from "../../store/hospitalStore"
import { hospitalsApi } from "../../api/index"
import { mergePersistedResources } from "../../store/hospitalStore"
import toast from "react-hot-toast"
import styles from "./HospitalStaffPortal.module.css"

// ─── Incoming patient mock data (pre-arrival alerts) ─────────────
const MOCK_ALERTS = [
  {
    id: "pa-001",
    incident: "TRK-20240312-001",
    triage_color: "RED",
    eta_minutes: 8,
    gcs: 8,
    spo2: 88,
    bp: "90/60",
    ambulance: "KL-05-AA-1234",
    chief_complaint: "Polytrauma - RTA",
  },
  {
    id: "pa-002",
    incident: "TRK-20240312-003",
    triage_color: "YELLOW",
    eta_minutes: 18,
    gcs: 13,
    spo2: 94,
    bp: "110/70",
    ambulance: "KL-07-FF-2345",
    chief_complaint: "Head injury - Fall",
  },
  {
    id: "pa-003",
    incident: "TRK-20240312-007",
    triage_color: "GREEN",
    eta_minutes: 25,
    gcs: 15,
    spo2: 98,
    bp: "120/80",
    ambulance: "KL-08-CC-9012",
    chief_complaint: "Laceration - minor",
  },
]

// ─── Numeric Stepper helper ───────────────────────────────────────
function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  label,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  label?: string
}) {
  return (
    <div className={styles.stepperRow}>
      {label && <span className={styles.stepperLabel}>{label}</span>}
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.stepperBtn}
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label="Decrease"
        >−</button>
        <input
          type="number"
          className={styles.stepperInput}
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const v = parseInt(e.target.value)
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
          }}
        />
        <button
          type="button"
          className={styles.stepperBtn}
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label="Increase"
        >+</button>
      </div>
    </div>
  )
}

// ─── Main Portal ──────────────────────────────────────────────────
export function HospitalStaffPortal() {
  const user       = useAuthStore((s) => s.user)
  const logout     = useAuthStore((s) => s.logout)
  const { setHospitals, updateResources, hospitals } = useHospitalStore()

  // The hospital this staff member belongs to
  const hospitalId = user?.hospital_id ?? null
  const hospital   = hospitalId ? hospitals[hospitalId] : null

  // ── Local editable resource state ──────────────────────────────
  const [icuAvail,      setIcuAvail]      = useState(0)
  const [ventAvail,     setVentAvail]     = useState(0)
  const [edCurrent,     setEdCurrent]     = useState(0)
  const [edTotal,       setEdTotal]       = useState(0)
  const [bloodBank,     setBloodBank]     = useState(true)
  const [otAvailable,   setOtAvailable]   = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [savedAt,       setSavedAt]       = useState<string | null>(null)
  const [loading,       setLoading]       = useState(true)

  // ── Acknowledge state: map of alert id → timestamp string ──────
  const [acknowledged, setAcknowledged] = useState<Record<string, string>>({})

  // ── Load hospital data ──────────────────────────────────────────
  useEffect(() => {
    if (!hospitalId) {
      setLoading(false)
      return
    }
    hospitalsApi.getAll()
      .then((r) => {
        const list: any[] = Array.isArray(r.data) ? r.data : []
        const merged = mergePersistedResources(list)
        setHospitals(merged)
        const h = merged.find((x) => x.id === hospitalId)
        if (h?.resources) {
          setIcuAvail(h.resources.icu_beds_available ?? 0)
          setVentAvail(h.resources.ventilators_available ?? 0)
          setEdCurrent(h.resources.ed_capacity_current ?? 0)
          setEdTotal(h.resources.ed_capacity_total ?? 0)
          setBloodBank(h.resources.blood_bank_available ?? true)
          setOtAvailable(h.resources.ot_available ?? true)
        }
      })
      .catch(() => toast.error("Failed to load hospital data"))
      .finally(() => setLoading(false))
  }, [hospitalId, setHospitals])

  // Sync form when hospital changes in store (e.g. after save)
  useEffect(() => {
    if (!hospital?.resources) return
    // Don't overwrite local edits after saving
  }, [hospital])

  // ── Save handler ────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!hospitalId) return
    setSaving(true)
    const resources = {
      icu_beds_available:    icuAvail,
      ventilators_available: ventAvail,
      ed_capacity_current:   edCurrent,
      ed_capacity_total:     edTotal,
      blood_bank_available:  bloodBank,
      ot_available:          otAvailable,
    }
    try {
      await hospitalsApi.updateResources(hospitalId, resources)
      updateResources(hospitalId, resources)
      const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      setSavedAt(now)
      toast.success("✅ Resources updated — live across all dashboards")
    } catch {
      // In demo mode, just update local store directly
      updateResources(hospitalId, resources)
      const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      setSavedAt(now)
      toast.success("✅ Resources updated — live across all dashboards")
    } finally {
      setSaving(false)
    }
  }, [hospitalId, icuAvail, ventAvail, edCurrent, edTotal, bloodBank, otAvailable, updateResources])

  // ── Acknowledge handler ─────────────────────────────────────────
  const handleAcknowledge = (alertId: string) => {
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    setAcknowledged((prev) => ({ ...prev, [alertId]: now }))
    toast.success("Patient acknowledged — trauma team notified")
  }

  // ── Derived status colors ───────────────────────────────────────
  const icuColor   = icuAvail > 5 ? "ok" : icuAvail > 0 ? "warn" : "danger"
  const ventColor  = ventAvail > 3 ? "ok" : ventAvail > 0 ? "warn" : "danger"
  const edPct      = edTotal > 0 ? (edCurrent / edTotal) * 100 : 0
  const edColor    = edPct < 70 ? "ok" : edPct < 90 ? "warn" : "danger"

  // ── Guard: no hospital linked ───────────────────────────────────
  if (!loading && !hospitalId) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏥</div>
        <h2 style={{ color: "var(--color-text-primary)", marginBottom: 8 }}>No hospital assigned</h2>
        <p>Your account is not linked to a hospital. Please contact your administrator.</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>

      {/* ── Portal Header ── */}
      <div className={styles.portalHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.hospitalIcon}>🏥</div>
          <div className={styles.headerInfo}>
            <div className={styles.headerRole}>Hospital Staff Portal</div>
            <div className={styles.headerHospitalName}>
              {loading ? "Loading…" : (user?.hospital_name ?? hospital?.name ?? "Your Hospital")}
            </div>
            <div className={styles.headerMeta}>
              <span className={styles.headerBadge}>{hospital?.district ?? "—"}</span>
              <span className={styles.headerBadge}>{hospital?.trauma_level?.replace(/_/g, " ") ?? "—"}</span>
              {hospital?.is_government && (
                <span className={`${styles.headerBadge} ${styles.gov}`}>Government</span>
              )}
              <span className={styles.liveIndicator}>
                <span className={styles.liveDot} />
                Live Updates Active
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right", fontSize: 12, color: "var(--color-text-muted)" }}>
            <div style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>{user?.full_name}</div>
            <div>{user?.email}</div>
          </div>
          <button className={styles.logoutBtn} onClick={logout} id="btn-logout-hospital">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* ── Live Status Overview (read-only) ── */}
      <div>
        <div className={styles.sectionTitle}>📊 Current Live Status — Visible to Dispatchers</div>
        <div className={styles.statusRow}>
          {[
            { label: "ICU Available", value: hospital?.resources?.icu_beds_available ?? icuAvail, color: icuColor, sub: `of ${hospital?.resources?.icu_beds_total ?? "—"} total` },
            { label: "Ventilators", value: hospital?.resources?.ventilators_available ?? ventAvail, color: ventColor, sub: `of ${hospital?.resources?.ventilators_total ?? "—"} total` },
            { label: "ED Occupancy", value: `${hospital?.resources?.ed_capacity_current ?? edCurrent}/${hospital?.resources?.ed_capacity_total ?? edTotal}`, color: edColor, sub: `${Math.round(edPct)}% capacity` },
            { label: "Blood Bank", value: (hospital?.resources?.blood_bank_available ?? bloodBank) ? "✓" : "✗", color: (hospital?.resources?.blood_bank_available ?? bloodBank) ? "ok" : "danger", sub: (hospital?.resources?.blood_bank_available ?? bloodBank) ? "Available" : "Unavailable" },
            { label: "OT Status", value: (hospital?.resources?.ot_available ?? otAvailable) ? "Ready" : "Busy", color: (hospital?.resources?.ot_available ?? otAvailable) ? "ok" : "warn", sub: "Operating Theatre" },
          ].map((card, i) => (
            <div key={i} className={styles.statusCard}>
              <div className={styles.statusCardLabel}>{card.label}</div>
              <div className={`${styles.statusCardValue} ${styles[`currentValue`]}`} style={{
                color: card.color === "ok" ? "#10b981" : card.color === "warn" ? "#f59e0b" : "#ef4444"
              }}>
                {card.value}
              </div>
              <div className={styles.statusCardSub}>{card.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Resource Update Panel ── */}
      <div>
        <div className={styles.sectionTitle}>⚙️ Update Hospital Resources</div>
        <div className={styles.resourceGrid}>

          {/* ICU Beds */}
          <div className={styles.resourceCard}>
            <div className={styles.resourceCardHeader}>
              <div className={styles.resourceCardIcon + " " + styles.icu}>🛏️</div>
              <div style={{ flex: 1 }}>
                <div className={styles.resourceCardLabel}>ICU Beds Available</div>
                <div className={styles.resourceCardCurrent}>
                  Currently: <span className={`${styles.currentValue} ${styles[icuColor]}`}>{icuAvail}</span>
                  {" "}/ {hospital?.resources?.icu_beds_total ?? "—"} total
                </div>
              </div>
            </div>
            <Stepper value={icuAvail} onChange={setIcuAvail} min={0} max={hospital?.resources?.icu_beds_total ?? 200} />
          </div>

          {/* Ventilators */}
          <div className={styles.resourceCard}>
            <div className={styles.resourceCardHeader}>
              <div className={styles.resourceCardIcon + " " + styles.vent}>🫁</div>
              <div style={{ flex: 1 }}>
                <div className={styles.resourceCardLabel}>Ventilators Available</div>
                <div className={styles.resourceCardCurrent}>
                  Currently: <span className={`${styles.currentValue} ${styles[ventColor]}`}>{ventAvail}</span>
                  {" "}/ {hospital?.resources?.ventilators_total ?? "—"} total
                </div>
              </div>
            </div>
            <Stepper value={ventAvail} onChange={setVentAvail} min={0} max={hospital?.resources?.ventilators_total ?? 100} />
          </div>

          {/* ED Occupancy */}
          <div className={styles.resourceCard}>
            <div className={styles.resourceCardHeader}>
              <div className={styles.resourceCardIcon + " " + styles.ed}>🚨</div>
              <div style={{ flex: 1 }}>
                <div className={styles.resourceCardLabel}>ED Occupancy</div>
                <div className={styles.resourceCardCurrent}>
                  Current: <span className={`${styles.currentValue} ${styles[edColor]}`}>{edCurrent}/{edTotal}</span>
                  {" "}({Math.round(edPct)}%)
                </div>
              </div>
            </div>
            <div className={styles.edRow}>
              <input
                type="number"
                className={styles.edInput}
                value={edCurrent}
                min={0}
                max={edTotal || 999}
                onChange={(e) => setEdCurrent(Math.max(0, parseInt(e.target.value) || 0))}
                title="Current ED patients"
                placeholder="Current"
              />
              <span className={styles.edSep}>/</span>
              <input
                type="number"
                className={styles.edInput}
                value={edTotal}
                min={1}
                max={999}
                onChange={(e) => setEdTotal(Math.max(1, parseInt(e.target.value) || 1))}
                title="Total ED capacity"
                placeholder="Total"
              />
            </div>
          </div>

          {/* Blood Bank */}
          <div className={styles.resourceCard}>
            <div className={styles.resourceCardHeader}>
              <div className={styles.resourceCardIcon + " " + styles.blood}>🩸</div>
              <div style={{ flex: 1 }}>
                <div className={styles.resourceCardLabel}>Blood Bank Status</div>
                <div className={styles.resourceCardCurrent}>
                  Currently: <span className={`${styles.currentValue} ${bloodBank ? styles.ok : styles.danger}`}>
                    {bloodBank ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.bloodToggleRow}>
              <button
                type="button"
                className={`${styles.bloodToggleBtn} ${bloodBank ? styles.active + " " + styles.available : ""}`}
                onClick={() => setBloodBank(true)}
                id="btn-blood-available"
              >
                ✓ Available
              </button>
              <button
                type="button"
                className={`${styles.bloodToggleBtn} ${!bloodBank ? styles.active + " " + styles.unavailable : ""}`}
                onClick={() => setBloodBank(false)}
                id="btn-blood-unavailable"
              >
                ✗ Not Available
              </button>
            </div>
          </div>

          {/* OT Status */}
          <div className={styles.resourceCard}>
            <div className={styles.resourceCardHeader}>
              <div className={styles.resourceCardIcon + " " + styles.vent}>🔬</div>
              <div style={{ flex: 1 }}>
                <div className={styles.resourceCardLabel}>Operating Theatre</div>
                <div className={styles.resourceCardCurrent}>
                  Currently: <span className={`${styles.currentValue} ${otAvailable ? styles.ok : styles.warn}`}>
                    {otAvailable ? "Ready" : "Busy"}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.otToggleRow}>
              <button
                type="button"
                className={`${styles.otToggleBtn} ${otAvailable ? styles.active + " " + styles.ready : ""}`}
                onClick={() => setOtAvailable(true)}
                id="btn-ot-ready"
              >
                ✓ Ready
              </button>
              <button
                type="button"
                className={`${styles.otToggleBtn} ${!otAvailable ? styles.active + " " + styles.busy : ""}`}
                onClick={() => setOtAvailable(false)}
                id="btn-ot-busy"
              >
                ⌛ Busy
              </button>
            </div>
          </div>

        </div>

        {/* Save Bar */}
        <div className={styles.saveBar} style={{ marginTop: 16 }}>
          <div className={styles.saveHint}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style={{ color: "var(--color-accent-cyan)" }}>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
            {savedAt
              ? `Last saved at ${savedAt} — all dispatchers can see these values`
              : "Changes will immediately reflect in the Command Center for all dispatchers"}
          </div>
          <button
            type="button"
            id="btn-save-resources"
            className={`${styles.saveBtn} ${savedAt ? styles.saved : ""}`}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <><div className={styles.spinner} /> Saving…</>
            ) : savedAt ? (
              <>✓ Saved — Update Again</>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z"/>
                </svg>
                Save & Publish Live
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Incoming Patient Alerts ── */}
      <div>
        <div className={styles.sectionTitle}>🚨 Incoming Patient Pre-Arrival Alerts</div>
        <div className={styles.alertsSection}>
          {MOCK_ALERTS.map((alert) => {
            const isCritical = alert.eta_minutes < 10
            const isAcknowledged = !!acknowledged[alert.id]
            return (
              <div
                key={alert.id}
                className={`${styles.alertCard} ${isAcknowledged ? styles.acknowledged : isCritical ? styles.critical : styles.standard}`}
              >
                {/* Triage Badge */}
                <div className={`${styles.triageBadge} ${styles[alert.triage_color]}`}>
                  {alert.triage_color}
                </div>

                {/* Patient Info */}
                <div className={styles.alertPatientInfo}>
                  <div className={styles.alertIncidentNo}>{alert.incident}</div>
                  <div className={styles.alertAmbulance}>
                    🚑 {alert.ambulance} · {alert.chief_complaint}
                  </div>
                  <div className={styles.alertVitals}>
                    <div className={styles.vitalChip}>GCS <strong>{alert.gcs}</strong></div>
                    <div className={styles.vitalChip}>SpO₂ <strong>{alert.spo2}%</strong></div>
                    <div className={styles.vitalChip}>BP <strong>{alert.bp}</strong></div>
                  </div>
                </div>

                {/* ETA */}
                <div className={styles.etaBlock}>
                  <div
                    className={styles.etaNumber}
                    style={{ color: isCritical ? "#ef4444" : "#f59e0b" }}
                  >
                    {alert.eta_minutes}
                  </div>
                  <div className={styles.etaLabel}>Min ETA</div>
                </div>

                {/* Acknowledge */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 120 }}>
                  <button
                    id={`btn-ack-${alert.id}`}
                    onClick={() => !isAcknowledged && handleAcknowledge(alert.id)}
                    className={`${styles.ackBtn} ${isAcknowledged ? styles.done : styles.pending}`}
                  >
                    {isAcknowledged ? (
                      <><svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> Acknowledged</>
                    ) : "Acknowledge"}
                  </button>
                  {isAcknowledged && (
                    <div className={styles.ackTime}>at {acknowledged[alert.id]}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
