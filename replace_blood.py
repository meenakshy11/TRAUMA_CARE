import pathlib, re

p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalDetailPage.tsx')
src = p.read_text(encoding='utf-8')

# Find and replace the entire blood bank section
start = src.find('{/* Blood Bank Stock */}')
end = src.find('      )}', start) + 8

if start != -1 and end > start:
    old = src[start:end]
    print('Found section, length:', len(old))
    
    new = """{/* Blood Bank Stock */}
      {bloodStock.length > 0 && (
        <div style={{ marginTop: 24, padding: 20, background: 'var(--color-bg-secondary)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>Blood Bank Stock</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>Dispatch reduces count · Receive increases count</p>
            </div>
            <span style={{ fontSize: 11, background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '3px 10px', borderRadius: 99, border: '1px solid #22c55e' }}>Blood bank active</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {bloodStock.map((s: any) => {
              const isLow = s.units_available > 0 && s.units_available <= 3
              const isEmpty = s.units_available === 0
              const badgeBg = isEmpty ? 'rgba(107,114,128,0.15)' : isLow ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'
              const badgeColor = isEmpty ? '#6b7280' : isLow ? '#ef4444' : '#22c55e'
              return (
                <div key={s.blood_group} style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>{s.blood_group}</span>
                    <span style={{ fontSize: 11, background: badgeBg, color: badgeColor, padding: '2px 8px', borderRadius: 99 }}>
                      {isEmpty ? 'Empty' : isLow ? s.units_available + ' — low' : s.units_available + ' units'}
                    </span>
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => updateBloodStock(s.blood_group, -1)} disabled={isEmpty} style={{ flex: 1, padding: '4px 0', fontSize: 12, borderRadius: 6, background: isEmpty ? 'transparent' : 'rgba(239,68,68,0.1)', color: isEmpty ? '#9ca3af' : '#ef4444', border: '1px solid ' + (isEmpty ? '#e5e7eb' : '#ef4444'), cursor: isEmpty ? 'not-allowed' : 'pointer' }}>- Dispatch</button>
                      <button onClick={() => updateBloodStock(s.blood_group, 1)} style={{ flex: 1, padding: '4px 0', fontSize: 12, borderRadius: 6, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid #22c55e', cursor: 'pointer' }}>+ Receive</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}"""
    
    src = src.replace(old, new)
    print('Replaced successfully')
else:
    print('Section not found')

p.write_text(src, encoding='utf-8')
