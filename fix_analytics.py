import pathlib, re

#  1. Add monthly trends endpoint to backend 
p = pathlib.Path('apps/backend/app/services/analytics_service.py')
src = p.read_text(encoding='utf-8')

if 'get_monthly_trends' not in src:
    src += '''

async def get_monthly_trends(db: AsyncSession, district: Optional[str] = None) -> list:
    import calendar
    results = []
    for i in range(5, -1, -1):
        today = datetime.now(timezone.utc)
        month = (today.month - i - 1) % 12 + 1
        year = today.year - ((today.month - i - 1) // 12)
        month_start = datetime(year, month, 1, tzinfo=timezone.utc)
        last_day = calendar.monthrange(year, month)[1]
        month_end = datetime(year, month, last_day, 23, 59, 59, tzinfo=timezone.utc)
        q = select(func.count(Incident.id)).where(
            Incident.created_at >= month_start,
            Incident.created_at <= month_end
        )
        if district:
            q = q.where(Incident.district == district)
        total = (await db.execute(q)).scalar() or 0
        q2 = select(func.count(Incident.id)).where(
            Incident.created_at >= month_start,
            Incident.created_at <= month_end,
            Incident.golden_hour_met == True
        )
        if district:
            q2 = q2.where(Incident.district == district)
        golden = (await db.execute(q2)).scalar() or 0
        results.append({"month": month_start.strftime("%b"), "incidents": total, "golden_met": golden})
    return results
'''
    p.write_text(src, encoding='utf-8')
    print('analytics_service.py: monthly trends added')
else:
    print('analytics_service.py: already has monthly trends')

#  2. Add endpoint to analytics router 
p2 = pathlib.Path('apps/backend/app/api/v1/analytics.py')
src2 = p2.read_text(encoding='utf-8')

if 'monthly-trends' not in src2:
    src2 = src2.replace(
        'from app.services.analytics_service import get_kpi_summary, get_district_performance',
        'from app.services.analytics_service import get_kpi_summary, get_district_performance, get_monthly_trends'
    )
    src2 += '''

@router.get("/monthly-trends")
async def monthly_trends(
    district: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_monthly_trends(db, district=district)
'''
    p2.write_text(src2, encoding='utf-8')
    print('analytics.py: endpoint added')
else:
    print('analytics.py: already has endpoint')

#  3. Fix analytics frontend 
p3 = pathlib.Path('apps/web/src/pages/Analytics/AnalyticsDashboardPage.tsx')
src3 = p3.read_text(encoding='utf-8')

# Add districtStore import
if 'districtStore' not in src3:
    src3 = src3.replace(
        'import { useEffect, useState } from "react"',
        'import { useEffect, useState } from "react"\nimport { useDistrictStore } from "../../store/districtStore"'
    )

# Add trendData state + selectedDistrict hook
if 'selectedDistrict' not in src3:
    src3 = src3.replace(
        '  const [kpi, setKpi]',
        '  const { selectedDistrict } = useDistrictStore()\n  const [kpi, setKpi]'
    )

if 'setTrendData' not in src3:
    src3 = src3.replace(
        '  const [districts, setDistricts] = useState<any[]>([])',
        '  const [districts, setDistricts] = useState<any[]>([])\n  const [trendData, setTrendData] = useState<any[]>([])'
    )

# Replace useEffect with live version
old_effect = '''  useEffect(() => {
    analyticsApi.getKPI().then(r => setKpi(r.data))
    analyticsApi.getDistrictPerformance().then(r =>
      setDistricts(Array.isArray(r.data) ? r.data : [])
    )
  }, [])'''

new_effect = '''  useEffect(() => {
    analyticsApi.getKPI(selectedDistrict || undefined).then(r => setKpi(r.data))
    analyticsApi.getDistrictPerformance().then(r => {
      const data = Array.isArray(r.data) ? r.data : []
      setDistricts(selectedDistrict ? data.filter((d: any) => d.district === selectedDistrict) : data)
    })
    analyticsApi.getMonthlyTrends(selectedDistrict || undefined).then(r =>
      setTrendData(Array.isArray(r.data) ? r.data : [])
    )
  }, [selectedDistrict])'''

if old_effect in src3:
    src3 = src3.replace(old_effect, new_effect)
    print('analytics useEffect: updated')
else:
    print('MISS: useEffect pattern')

# Remove hardcoded trendData
src3 = re.sub(
    r'  const trendData = \[[\s\S]*?\]\n\n',
    '  const liveTrendData = trendData.length > 0 ? trendData : []\n\n',
    src3
)

# Replace trendData reference in chart
src3 = src3.replace('<LineChart data={trendData}', '<LineChart data={liveTrendData}')

# Fix KPI cards to use real data without fake fallbacks
src3 = src3.replace(
    'value: `${kpi?.golden_hour_compliance_pct || 68}%`',
    'value: `${kpi?.golden_hour_compliance_pct ?? 0}%`'
)
src3 = src3.replace(
    'value: `${Math.round((kpi?.avg_response_time_sec || 486) / 60)} min`',
    'value: kpi ? `${Math.round((kpi.avg_response_time_sec || 0) / 60)} min` : "— min"'
)
src3 = src3.replace(
    'value: kpi?.total_incidents_today || 142,',
    'value: kpi?.total_incidents_today ?? 0,'
)
src3 = src3.replace(
    'value: kpi?.ambulances_available || 186,',
    'value: kpi?.ambulances_available ?? 0,'
)

p3.write_text(src3, encoding='utf-8')
print('AnalyticsDashboardPage: updated')

#  4. Add getMonthlyTrends to API index 
p4 = pathlib.Path('apps/web/src/api/index.ts')
src4 = p4.read_text(encoding='utf-8')

if 'getMonthlyTrends' not in src4:
    src4 = src4.replace(
        '  getDistrictPerformance: async () => {',
        '''  getMonthlyTrends: async (district?: string) => {
    if (DEMO) return { data: [] }
    return apiClient.get("/analytics/monthly-trends", { params: { district } })
  },
  getDistrictPerformance: async () => {'''
    )
    p4.write_text(src4, encoding='utf-8')
    print('api/index.ts: getMonthlyTrends added')
else:
    print('api/index.ts: already has getMonthlyTrends')
