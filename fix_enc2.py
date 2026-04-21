import pathlib, re

p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalDetailPage.tsx')
src = p.read_text(encoding='utf-8')

# Fix corrupted characters
src = src.replace('ΓÇö', '')
src = src.replace('Γ£à', '')  
src = src.replace('≡ffó', '')
src = src.replace('ΓÇô', '-')
src = src.replace('â€"', '-')

p.write_text(src, encoding='utf-8')
print('Encoding fixed')
