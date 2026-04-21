import pathlib

p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalListPage.tsx')
src = p.read_text(encoding='utf-8')

old = '<th style={{ textAlign: "center" }}>Blood Bank</th>'
new = '''<th style={{ textAlign: "center" }}>Blood Bank</th>'''

# Find the table and insert blood search before it
old_table = '<table style='
idx = src.find(old_table)
if idx != -1:
    blood_search = '''<div style={{ marginBottom: 16, padding: 14, background: "var(--color-bg-secondary)", borderRadius: 8, border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-primary)" }}>Search by Blood Group:</span>
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
        </div>
        '''
    src = src[:idx] + blood_search + src[idx:]
    print('Blood search inserted before table')
else:
    print('MISS: table not found')
    # Show what exists around filtered.map
    idx2 = src.find('{filtered.map')
    print(repr(src[max(0,idx2-300):idx2]))

p.write_text(src, encoding='utf-8')
