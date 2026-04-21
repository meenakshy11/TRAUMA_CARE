import pathlib

p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalDetailPage.tsx')
src = p.read_text(encoding='utf-8')

# Add bloodStockApi import
src = src.replace(
    "import { hospitalsApi } from '../../api/index'",
    "import { hospitalsApi, bloodStockApi } from '../../api/index'"
)

# Add blood stock state after hospital state
src = src.replace(
    "  const [loading, setLoading] = useState(true)",
    """  const [loading, setLoading] = useState(true)
  const [bloodStock, setBloodStock] = useState<any[]>([])"""
)

# Fetch blood stock after hospital loads
src = src.replace(
    "    hospitalsApi.getOne(id)\n      .then(r => setHospital(r.data))\n      .final",
    """    hospitalsApi.getOne(id)
      .then(r => {
        setHospital(r.data)
        bloodStockApi.getByHospital(id).then(b => setBloodStock(Array.isArray(b.data) ? b.data : [])).catch(() => {})
      })
      .final"""
)

# Find where to add blood stock display - before closing of main content
# Look for the return statement end
old = "  if (loading) return <div"
new = """  const BLOOD_GROUP_COLORS: Record<string, string> = {
    'A+': '#ef4444', 'A-': '#f97316', 'B+': '#3b82f6', 'B-': '#6366f1',
    'O+': '#22c55e', 'O-': '#14b8a6', 'AB+': '#a855f7', 'AB-': '#ec4899'
  }

  if (loading) return <div"""

src = src.replace(old, new)

# Add blood stock section before the closing </div> of main content
# Find last </div> before export
idx = src.rfind('export default')
# Find the return statement
ret_idx = src.rfind('return (', 0, idx)
# Find closing of return - last ) before export
close_idx = src.rfind(')', 0, idx)

blood_section = """
        {/* Blood Stock Section */}
        {bloodStock.length > 0 && (
          <div style={{ marginTop: 24, padding: 20, background: 'var(--color-bg-secondary)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Blood Bank Stock
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {bloodStock.map((s: any) => (
                <div key={s.blood_group} style={{
                  padding: '12px 16px', borderRadius: 8, textAlign: 'center',
                  background: s.units_available > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${s.units_available > 0 ? '#22c55e' : '#ef4444'}`
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: BLOOD_GROUP_COLORS[s.blood_group] || 'var(--color-text-primary)' }}>
                    {s.blood_group}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: s.units_available > 0 ? '#22c55e' : '#ef4444', marginTop: 4 }}>
                    {s.units_available > 0 ? `${s.units_available} units` : 'Not Available'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
"""

# Insert before last closing tags
src = src.replace(
    "  if (!hospital) return <div",
    blood_section + "\n  if (!hospital) return <div"
)

p.write_text(src, encoding='utf-8')
print('HospitalDetailPage updated')
print('has bloodStock:', 'bloodStock' in src)
