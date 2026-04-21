import pathlib

p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalDetailPage.tsx')
src = p.read_text(encoding='utf-8')

# Remove the blood section that's outside return
import re
src = re.sub(r'\n        \{/\* Blood Bank Stock \*/\}[\s\S]*export default HospitalDetailPage\n', '', src)

# Now insert BEFORE the last </div> (line 154 = '    </div>')
# The return closes with:  \n    </div>\n  )\n}
old = '\n    </div>\n  )\n}'
new = '''
      {/* Blood Bank Stock */}
      {bloodStock.length > 0 && (
        <div style={{ marginTop: 24, padding: 20, background: 'var(--color-bg-secondary)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Blood Bank Stock</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {bloodStock.map((s: any) => (
              <div key={s.blood_group} style={{ padding: '12px 16px', borderRadius: 8, textAlign: 'center', background: s.units_available > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: s.units_available > 0 ? '1px solid #22c55e' : '1px solid #ef4444' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)' }}>{s.blood_group}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.units_available > 0 ? '#22c55e' : '#ef4444', marginTop: 4 }}>
                  {s.units_available > 0 ? s.units_available + ' units' : 'Not Available'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}'''

if old in src:
    src = src.replace(old, new)
    print('Inserted correctly')
else:
    print('Pattern not found')
    print(repr(src[-100:]))

src += '\n\nexport default HospitalDetailPage\n'
p.write_text(src, encoding='utf-8')
