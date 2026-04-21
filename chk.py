import pathlib
src = pathlib.Path('apps/web/src/pages/Hospitals/HospitalDetailPage.tsx').read_text(encoding='utf-8')
print('has bloodStock:', 'bloodStock' in src)
print('has Blood Bank Stock:', 'Blood Bank Stock' in src)
print('has bloodStockApi:', 'bloodStockApi' in src)
