import pathlib

# Add blood stock search to HospitalListPage
p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalListPage.tsx')
src = p.read_text(encoding='utf-8')

# Add import
if 'bloodStockApi' not in src:
    src = src.replace(
        'import { hospitalsApi } from "../../api/index"',
        'import { hospitalsApi, bloodStockApi } from "../../api/index"'
    )

# Add blood group search state
if 'bloodGroup' not in src:
    src = src.replace(
        'export function HospitalListPage() {',
        '''export function HospitalListPage() {
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
  }'''
    )

# Add React import if missing
if 'import React' not in src:
    src = src.replace(
        'import { useEffect, useState } from "react"',
        'import React, { useEffect, useState } from "react"'
    )

# Add blood group search UI before the hospital list
old_ui = '<div className={styles.hospitalGrid}'
new_ui = '''<div style={{ marginBottom: 20, padding: 16, background: "var(--color-bg-secondary)", borderRadius: 8, border: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-primary)" }}>
            Search by Blood Group:
          </span>
          <select
            value={bloodGroup}
            onChange={e => { setBloodGroup(e.target.value); searchByBloodGroup(e.target.value) }}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--color-border-strong)", background: "var(--color-bg-primary)", color: "var(--color-text-primary)", fontSize: 13 }}
          >
            <option value="">-- Select Blood Group --</option>
            {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
          {bloodSearching && <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Searching...</span>}
          {bloodGroup && !bloodSearching && (
            <span style={{ fontSize: 13, color: "var(--color-accent-green)", fontWeight: 600 }}>
              {bloodResults.length} hospitals have {bloodGroup} available
            </span>
          )}
          {bloodGroup && !bloodSearching && bloodResults.length > 0 && (
            <div style={{ width: "100%", marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {bloodResults.map((r: any) => (
                <span key={r.hospital_id} style={{ padding: "3px 10px", borderRadius: 99, background: "rgba(34,197,94,0.15)", border: "1px solid #22c55e", fontSize: 12, color: "#22c55e" }}>
                  {r.units_available} units
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={styles.hospitalGrid}'''

if old_ui in src and 'bloodGroup' in src:
    src = src.replace(old_ui, new_ui)
    print('Blood group search UI added')
else:
    print('MISS: hospital grid div not found or bloodGroup missing')

p.write_text(src, encoding='utf-8')
print('HospitalListPage updated')
