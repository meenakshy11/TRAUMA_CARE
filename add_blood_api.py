import pathlib, re

p = pathlib.Path('apps/web/src/api/index.ts')
src = p.read_text(encoding='utf-8')

if 'blood-stock' not in src:
    src = src.replace(
        'export const analyticsApi',
        '''export const bloodStockApi = {
  getByHospital: (hospitalId: string) =>
    apiClient.get(`/blood-stock/${hospitalId}`),
  searchByBloodGroup: (bloodGroup: string) =>
    apiClient.get("/blood-stock/search", { params: { blood_group: bloodGroup } }),
  updateStock: (hospitalId: string, bloodGroup: string, units: number) =>
    apiClient.put(`/blood-stock/${hospitalId}`, null, { params: { blood_group: bloodGroup, units } }),
}

export const analyticsApi'''
    )
    p.write_text(src, encoding='utf-8')
    print('bloodStockApi added to index.ts')
else:
    print('already exists')
