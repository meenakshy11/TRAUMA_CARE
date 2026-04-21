import pathlib, re

p = pathlib.Path('apps/web/src/pages/Analytics/AnalyticsDashboardPage.tsx')
src = p.read_text(encoding='utf-8')

# Add trendData state
src = src.replace(
    "  const [districts, setDistricts] = useState<any[]>([])",
    "  const [districts, setDistricts] = useState<any[]>([])\n  const [trendData, setTrendData] = useState<any[]>([])"
)

# Remove hardcoded trendData
src = re.sub(
    r"  const trendData = \[[\s\S]*?\]\n",
    "",
    src
)

# Add API call in useEffect
src = src.replace(
    "    analyticsApi.getKPI(selectedDistrict || undefined).then(r => setKpi(r.data))",
    "    analyticsApi.getKPI(selectedDistrict || undefined).then(r => setKpi(r.data))\n    analyticsApi.getMonthlyTrends(selectedDistrict || undefined).then(r => setTrendData(Array.isArray(r.data) ? r.data : []))"
)

p.write_text(src, encoding='utf-8')
print('AnalyticsDashboardPage updated')
print('trendData state:', 'setTrendData' in src)
print('getMonthlyTrends call:', 'getMonthlyTrends' in src)
