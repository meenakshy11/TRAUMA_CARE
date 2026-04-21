import pathlib
p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalDetailPage.tsx')
src = p.read_text(encoding='utf-8')
idx = src.find('Blood Bank Stock')
print(repr(src[idx:idx+500]))
