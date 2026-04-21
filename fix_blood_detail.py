import pathlib

p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalDetailPage.tsx')
src = p.read_text(encoding='utf-8')

# Find the last </div> before export default
idx = src.rfind('export default')
close_idx = src.rfind(')', 0, idx)

blood_section = """
        {/* Blood Bank Stock */}
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
                  border: s.units_available > 0 ? '1px solid #22c55e' : '1px solid #ef4444'
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)' }}>
                    {s.blood_group}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: s.units_available > 0 ? '#22c55e' : '#ef4444', marginTop: 4 }}>
                    {s.units_available > 0 ? s.units_available + ' units' : 'Not Available'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
"""

# Insert before the last closing ) of return statement
src = src[:close_idx] + blood_section + src[close_idx:]
p.write_text(src, encoding='utf-8')
print('Blood section inserted')
print('has Blood Bank Stock:', 'Blood Bank Stock' in src)
