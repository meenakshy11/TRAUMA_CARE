import pathlib, re

p = pathlib.Path('apps/web/src/api/index.ts')
src = p.read_text(encoding='utf-8')

# Add monthly trends to analyticsApi
src = src.replace(
    "  getDistrictPerformance: async () => {",
    """  getMonthlyTrends: async (district?: string) => {
    if (DEMO) return { data: [
      { month: "Oct", incidents: 156, golden_met: 118 },
      { month: "Nov", incidents: 178, golden_met: 134 },
      { month: "Dec", incidents: 201, golden_met: 149 },
      { month: "Jan", incidents: 189, golden_met: 143 },
      { month: "Feb", incidents: 212, golden_met: 165 },
      { month: "Mar", incidents: 234, golden_met: 189 },
    ] }
    return apiClient.get("/analytics/monthly-trends", { params: { district } })
  },
  getDistrictPerformance: async () => {"""
)

p.write_text(src, encoding='utf-8')
print('api/index.ts updated:', 'getMonthlyTrends' in src)
