import pathlib

# Read original clean file from git
orig = pathlib.Path('apps/web/src/pages/Hospitals/HospitalDetailPage_original.tsx').read_text(encoding='utf-8')

# Add bloodStockApi import
orig = orig.replace(
    "import { hospitalsApi } from '../../api/index'",
    "import { hospitalsApi, bloodStockApi } from '../../api/index'"
)

# Add blood stock state
orig = orig.replace(
    "  const [loading, setLoading] = useState(true)",
    "  const [loading, setLoading] = useState(true)\n  const [bloodStock, setBloodStock] = useState<any[]>([])"
)

# Add blood stock fetch inside useEffect
orig = orig.replace(
    "    hospitalsApi.getOne(id)",
    "    bloodStockApi.getByHospital(id).then(r => setBloodStock(Array.isArray(r.data) ? r.data : [])).catch(() => {})\n    hospitalsApi.getOne(id)"
)

# Find the last </div> before ) that closes return
# The return in this file ends with specific pattern - find it
lines = orig.split('\n')
# Find last line with just '    </div>'
last_div_idx = None
for i in range(len(lines)-1, -1, -1):
    if lines[i].strip() == '</div>' and lines[i].startswith('    '):
        last_div_idx = i
        break

print(f'Last closing div at line {last_div_idx}: {repr(lines[last_div_idx])}')
print(f'Next line: {repr(lines[last_div_idx+1])}')

# Insert blood stock section before that last </div>
blood_lines = [
    '      {/* Blood Bank Stock */}',
    '      {bloodStock.length > 0 && (',
    "        <div style={{ marginTop: 24, padding: 20, background: 'var(--color-bg-secondary)', borderRadius: 10, border: '1px solid var(--color-border)' }}>",
    "          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Blood Bank Stock</h3>",
    "          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>",
    '            {bloodStock.map((s: any) => (',
    "              <div key={s.blood_group} style={{ padding: '12px 16px', borderRadius: 8, textAlign: 'center', background: s.units_available > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: s.units_available > 0 ? '1px solid #22c55e' : '1px solid #ef4444' }}>",
    "                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)' }}>{s.blood_group}</div>",
    "                <div style={{ fontSize: 13, fontWeight: 600, color: s.units_available > 0 ? '#22c55e' : '#ef4444', marginTop: 4 }}>",
    "                  {s.units_available > 0 ? s.units_available + ' units' : 'Not Available'}",
    '                </div>',
    '              </div>',
    '            ))}',
    '          </div>',
    '        </div>',
    '      )}',
]

lines = lines[:last_div_idx] + blood_lines + lines[last_div_idx:]
result = '\n'.join(lines)

pathlib.Path('apps/web/src/pages/Hospitals/HospitalDetailPage.tsx').write_text(result, encoding='utf-8')
print('Done - file written cleanly')
