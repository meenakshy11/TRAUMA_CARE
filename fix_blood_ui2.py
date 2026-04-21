import pathlib

p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalListPage.tsx')
src = p.read_text(encoding='utf-8')

old = '<table className="data-table">'
new = '''<div style={{ marginBottom: 16, padding: 14, background: "var(--color-bg-secondary)", borderRadius: 8, border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
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
            <table className="data-table">'''

if old in src:
    src = src.replace(old, new, 1)
    print('Blood search UI inserted')
else:
    print('MISS')

p.write_text(src, encoding='utf-8')
