import pathlib, re

p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalDetailPage.tsx')
src = p.read_text(encoding='utf-8')

# Add useAuthStore import
if 'useAuthStore' not in src:
    src = src.replace(
        "import { hospitalsApi, bloodStockApi } from '../../api/index'",
        "import { hospitalsApi, bloodStockApi } from '../../api/index'\nimport { useAuthStore } from '../../store/authStore'"
    )

# Add update handler after bloodStock state
if 'updateBloodStock' not in src:
    src = src.replace(
        "  const [bloodStock, setBloodStock] = useState<any[]>([])",
        """  const [bloodStock, setBloodStock] = useState<any[]>([])
  const user = useAuthStore((s) => s.user)
  const canEdit = user?.role === 'HOSPITAL_STAFF' || user?.role === 'ADMIN'

  const updateBloodStock = async (bloodGroup: string, delta: number) => {
    if (!id) return
    const current = bloodStock.find((s: any) => s.blood_group === bloodGroup)
    const newUnits = Math.max(0, (current?.units_available || 0) + delta)
    try {
      await bloodStockApi.updateStock(id, bloodGroup, newUnits)
      setBloodStock(prev => prev.map((s: any) =>
        s.blood_group === bloodGroup ? { ...s, units_available: newUnits } : s
      ))
    } catch (e) {
      console.error('Failed to update blood stock')
    }
  }"""
    )

# Replace the blood stock display with interactive version
old_section = """          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {bloodStock.map((s: any) => (
              <div key={s.blood_group} style={{ padding: '12px 16px', borderRadius: 8, textAlign: 'center', background: s.units_available > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: s.units_available > 0 ? '1px solid #22c55e' : '1px solid #ef4444' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)' }}>{s.blood_group}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.units_available > 0 ? '#22c55e' : '#ef4444', marginTop: 4 }}>
                  {s.units_available > 0 ? s.units_available + ' units' : 'Not Available'}
                </div>
              </div>
            ))}
          </div>"""

new_section = """          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {bloodStock.map((s: any) => (
              <div key={s.blood_group} style={{ padding: '12px 16px', borderRadius: 8, textAlign: 'center', background: s.units_available > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: s.units_available > 0 ? '1px solid #22c55e' : '1px solid #ef4444' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)' }}>{s.blood_group}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.units_available > 0 ? '#22c55e' : '#ef4444', marginTop: 4 }}>
                  {s.units_available > 0 ? s.units_available + ' units' : 'Not Available'}
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center' }}>
                    <button
                      onClick={() => updateBloodStock(s.blood_group, -1)}
                      disabled={s.units_available === 0}
                      title="Dispatched (decrease)"
                      style={{ padding: '2px 10px', borderRadius: 4, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: s.units_available === 0 ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 700, opacity: s.units_available === 0 ? 0.4 : 1 }}
                    >−</button>
                    <button
                      onClick={() => updateBloodStock(s.blood_group, 1)}
                      title="Received (increase)"
                      style={{ padding: '2px 10px', borderRadius: 4, border: '1px solid #22c55e', background: 'transparent', color: '#22c55e', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}
                    >+</button>
                  </div>
                )}
                {canEdit && (
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    − dispatch &nbsp;|&nbsp; + receive
                  </div>
                )}
              </div>
            ))}
          </div>"""

if old_section in src:
    src = src.replace(old_section, new_section)
    print('Blood stock section updated with actions')
else:
    print('MISS - section not found')

p.write_text(src, encoding='utf-8')
