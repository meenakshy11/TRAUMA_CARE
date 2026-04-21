import pathlib, re

#  Fix 1: BlackSpots - convert severity + road type buttons to dropdowns 
p = pathlib.Path('apps/web/src/pages/BlackSpots/BlackSpotPage.tsx')
src = p.read_text(encoding='utf-8')

# Replace severity buttons with dropdown
old_sev = '''          {["ALL", "HIGH", "MEDIUM", "LOW"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="btn"
              style={{
                padding: "5px 13px",
                background: filter === s ? "var(--color-accent-blue)" : "transparent",
                border: filter === s ? "1px solid var(--color-accent-blue)" : "1px solid var(--color-border-strong)",
                color: filter === s ? "#fff" : "var(--color-text-secondary)",
                borderRadius: 99, fontSize: 12, transition: "all .15s",
              }}
            >
              {s}
            </button>
          ))}'''

new_sev = '''          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{
              padding: "5px 12px", borderRadius: 6, fontSize: 12,
              border: "1px solid var(--color-border-strong)",
              background: "var(--color-bg-secondary)",
              color: "var(--color-text-primary)", cursor: "pointer",
            }}
          >
            {["ALL","HIGH","MEDIUM","LOW"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>'''

if old_sev in src:
    src = src.replace(old_sev, new_sev)
    print("Severity buttons -> dropdown: OK")
else:
    print("MISS: severity buttons")

# Replace road type buttons with dropdown
old_road_start = '{roadTypes.map(rt => ('
idx = src.find(old_road_start)
if idx != -1:
    # Find end of this map block
    end_idx = src.find('))}\n', idx) + 4
    old_road = src[idx:end_idx]
    new_road = '''<select
          value={roadTypeFilter}
          onChange={e => setRoadTypeFilter(e.target.value)}
          style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 12,
            border: "1px solid var(--color-border-strong)",
            background: "var(--color-bg-secondary)",
            color: "var(--color-text-primary)", cursor: "pointer",
          }}
        >
          {roadTypes.map(rt => <option key={rt} value={rt}>{rt}</option>)}
        </select>'''
    src = src.replace(old_road, new_road)
    print("Road type buttons -> dropdown: OK")
else:
    print("MISS: road type buttons")

p.write_text(src, encoding='utf-8')

#  Fix 2: KPI cards - full width alignment 
p2 = pathlib.Path('apps/web/src/pages/CommandCenter/CommandCenterPage.tsx')
src2 = p2.read_text(encoding='utf-8')

src2 = src2.replace(
    'minWidth: 130, padding: "10px 16px",',
    'flex: 1, padding: "10px 20px",'
)
src2 = src2.replace(
    'padding: "0 16px",',
    'padding: "0",'
)
p2.write_text(src2, encoding='utf-8')
print("KPI cards full width: OK")

#  Fix 3: Hospital Dashboard - hide Acknowledge for non-hospital roles 
p3 = pathlib.Path('apps/web/src/pages/HospitalDashboard/HospitalDashboardPage.tsx')
src3 = p3.read_text(encoding='utf-8')

# Add auth import if not there
if 'useAuthStore' not in src3:
    src3 = src3.replace(
        'import { useEffect, useState } from "react"',
        'import { useEffect, useState } from "react"\nimport { useAuthStore } from "../../store/authStore"'
    )

# Add user role check in component
if 'canAcknowledge' not in src3:
    src3 = src3.replace(
        'const [acknowledged, setAcknowledged]',
        'const user = useAuthStore((s) => s.user)\n  const canAcknowledge = user?.role === "HOSPITAL_STAFF" || user?.role === "ADMIN"\n  const [acknowledged, setAcknowledged]'
    )

# Wrap acknowledge button with role check
src3 = src3.replace(
    '<button\n                        \n                        onClick={() => !acknowledged[p.id] && handleAcknowledge(p.id)}',
    '{canAcknowledge ? <button\n                        \n                        onClick={() => !acknowledged[p.id] && handleAcknowledge(p.id)}'
)

# Find closing of the button and add conditional closing
src3 = src3.replace(
    '{acknowledged[p.id] ? (\n                          <>\n                            \n                            Acknowledged\n                          </>\n                        ) : "Acknowledge"}\n                      </button>',
    '{acknowledged[p.id] ? (\n                          <>\n                            \n                            Acknowledged\n                          </>\n                        ) : "Acknowledge"}\n                      </button> : <span style={{ padding: "8px 16px", borderRadius: 6, fontSize: 13, color: acknowledged[p.id] ? "var(--color-success)" : "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>{acknowledged[p.id] ? "Acknowledged" : "Pending"}</span>}'
)

p3.write_text(src3, encoding='utf-8')
print("Acknowledge button role-gated: OK")
