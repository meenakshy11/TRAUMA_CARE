import pathlib, re

# Fix Incidents - clean up duplicates
p = pathlib.Path("apps/web/src/pages/Incidents/IncidentListPage.tsx")
src = p.read_text(encoding="utf-8")

# Remove all duplicate import lines, keep only one
src = re.sub(r"(import \{ useDistrictStore \} from ['\"]../../store/districtStore['\"])\n", "", src)
src = src.replace(
    'import { useNavigate } from "react-router-dom"',
    'import { useDistrictStore } from "../../store/districtStore"\nimport { useNavigate } from "react-router-dom"'
)

# Remove duplicate useDistrictStore() hook calls, keep only one
src = re.sub(r"(\s*const \{ selectedDistrict \} = useDistrictStore\(\)\n)+",
             "\n  const { selectedDistrict } = useDistrictStore()\n", src)

p.write_text(src, encoding="utf-8")
print("Incidents cleaned")

# Fix Analytics - replace entire useEffect with clean version
p = pathlib.Path("apps/web/src/pages/Analytics/AnalyticsDashboardPage.tsx")
src = p.read_text(encoding="utf-8")

# Remove old localStorage-based logic, replace with clean selectedDistrict
old = """  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("trauma_user") || "{}")
    const userDistrict = user?.district || undefined
    analyticsApi.getKPI(userDistrict).then(r => setKpi(r.data))
    if (userDistrict) analyticsApi.getDistrictPerformance().then(r =>
      setDistricts((r.data as any[]).filter((d: any) => d.district === userDistrict))
    )
    if (!JSON.parse(localStorage.getItem("trauma_user") || "{}").district) analyticsApi.getDistrictPerformance().then(r =>
      setDistricts(Array.isArray(r.data) ? r.data : [])
    )
  }, [selectedDistrict])"""

new = """  useEffect(() => {
    analyticsApi.getKPI(selectedDistrict || undefined).then(r => setKpi(r.data))
    analyticsApi.getDistrictPerformance().then(r => {
      const data = Array.isArray(r.data) ? r.data : []
      setDistricts(selectedDistrict ? data.filter((d: any) => d.district === selectedDistrict) : data)
    })
  }, [selectedDistrict])"""

if old in src:
    src = src.replace(old, new)
    print("Analytics useEffect replaced")
else:
    print("Analytics pattern not found - showing current useEffect:")
    idx = src.find("useEffect")
    print(repr(src[idx:idx+400]))

p.write_text(src, encoding="utf-8")
