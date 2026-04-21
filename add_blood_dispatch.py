import pathlib

p = pathlib.Path('apps/web/src/pages/CommandCenter/components/DispatchPanel.tsx')
src = p.read_text(encoding='utf-8')

# Add bloodStockApi import
src = src.replace(
    'import { dispatchApi } from "../../../api/index"',
    'import { dispatchApi, bloodStockApi } from "../../../api/index"'
)

# Add blood search state
src = src.replace(
    '  const [loading, setLoading] = useState(false)',
    '''  const [loading, setLoading] = useState(false)
  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
  const [bloodGroup, setBloodGroup] = useState("")
  const [bloodResults, setBloodResults] = useState<any[]>([])
  const [bloodSearching, setBloodSearching] = useState(false)

  const searchBlood = async (bg: string) => {
    setBloodGroup(bg)
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

# Find the return statement to add blood search UI
# Add before closing </div> of the panel
old = '  return (\n    <div'
new = '''  return (
    <div'''

# Find good insertion point - look for the last section
idx = src.rfind('</div>')
blood_ui = '''
      {/* Blood Group Search */}
      <div style={{ marginTop: 16, padding: 12, background: "var(--color-bg-tertiary)", borderRadius: 8, border: "1px solid var(--color-border)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
          Blood Bank Search
        </div>
        <select
          value={bloodGroup}
          onChange={e => searchBlood(e.target.value)}
          style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--color-border-strong)", background: "var(--color-bg-secondary)", color: "var(--color-text-primary)", fontSize: 13, marginBottom: 8 }}
        >
          <option value="">-- Select Blood Group --</option>
          {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
        </select>
        {bloodSearching && <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Searching...</div>}
        {bloodGroup && !bloodSearching && (
          <div style={{ fontSize: 12, color: "var(--color-accent-green)", fontWeight: 600 }}>
            {bloodResults.length} hospitals have {bloodGroup} available
            {bloodResults.slice(0, 3).map((r: any) => (
              <div key={r.hospital_id} style={{ color: "var(--color-text-secondary)", fontWeight: 400, marginTop: 2 }}>
                 {r.units_available} units
              </div>
            ))}
          </div>
        )}
      </div>
'''

# Insert before last closing div
src = src[:idx] + blood_ui + src[idx:]

p.write_text(src, encoding='utf-8')
print('DispatchPanel updated')
print('has bloodSearch:', 'bloodGroup' in src)
