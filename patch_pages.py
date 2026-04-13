import pathlib, re

def patch(fpath, replacements):
    p = pathlib.Path(fpath)
    src = p.read_text(encoding="utf-8")
    for old, new in replacements:
        if old in src:
            src = src.replace(old, new)
            print(f"  OK: {old[:50]!r}")
        else:
            print(f"  MISS: {old[:50]!r}")
    p.write_text(src, encoding="utf-8")

# Incidents
patch("apps/web/src/pages/Incidents/IncidentListPage.tsx", [
    ('import { useEffect, useState } from "react"',
     'import { useEffect, useState } from "react"\nimport { useDistrictStore } from "../../store/districtStore"'),
    ('  const [incidents, setIncidents]',
     '  const { selectedDistrict } = useDistrictStore()\n  const [incidents, setIncidents]'),
    ('incidentsApi.getAll().then',
     'incidentsApi.getAll({ district: selectedDistrict || undefined }).then'),
    ('  }, [])', '  }, [selectedDistrict])'),
])

# Hospitals
patch("apps/web/src/pages/Hospitals/HospitalListPage.tsx", [
    ('import { useEffect, useState } from "react"',
     'import { useEffect, useState } from "react"\nimport { useDistrictStore } from "../../store/districtStore"'),
    ('export function HospitalListPage() {',
     'export function HospitalListPage() {\n  const { selectedDistrict } = useDistrictStore()'),
    ('hospitalsApi.getAll().then',
     'hospitalsApi.getAll({ district: selectedDistrict || undefined }).then'),
    ('  }, [])', '  }, [selectedDistrict])'),
])

# BlackSpots
patch("apps/web/src/pages/BlackSpots/BlackSpotPage.tsx", [
    ('import { useEffect, useState } from "react"',
     'import { useEffect, useState } from "react"\nimport { useDistrictStore } from "../../store/districtStore"'),
    ('export function BlackSpotPage() {',
     'export function BlackSpotPage() {\n  const { selectedDistrict } = useDistrictStore()'),
    ('blackspotsApi.getAll().then',
     'blackspotsApi.getAll({ district: selectedDistrict || undefined }).then'),
    ('  }, [])', '  }, [selectedDistrict])'),
])

# Analytics
patch("apps/web/src/pages/Analytics/AnalyticsDashboardPage.tsx", [
    ('import { analyticsApi } from "../../api/index"',
     'import { analyticsApi } from "../../api/index"\nimport { useDistrictStore } from "../../store/districtStore"'),
    ('  const [kpi, setKpi]',
     '  const { selectedDistrict } = useDistrictStore()\n  const [kpi, setKpi]'),
    ('analyticsApi.getKPI().then',
     'analyticsApi.getKPI(selectedDistrict || undefined).then'),
    ('  }, [])', '  }, [selectedDistrict])'),
])

print("All done")
