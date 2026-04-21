import pathlib, re

p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalDetailPage.tsx')
src = p.read_text(encoding='utf-8')

# Remove duplicate bloodStock declaration
src = re.sub(
    r"  const \[bloodStock, setBloodStock\] = useState<any\[\]>\(\[\]\)\n  const \[bloodStock, setBloodStock\] = useState<any\[\]>\(\[\]\)",
    "  const [bloodStock, setBloodStock] = useState<any[]>([])",
    src
)

# Remove duplicate bloodStockApi fetch
lines = src.split('\n')
seen_blood_fetch = False
clean_lines = []
for line in lines:
    if 'bloodStockApi.getByHospital' in line:
        if not seen_blood_fetch:
            clean_lines.append(line)
            seen_blood_fetch = True
    else:
        clean_lines.append(line)

src = '\n'.join(clean_lines)
p.write_text(src, encoding='utf-8')
print('Duplicates removed')
print('bloodStock count:', src.count('const [bloodStock'))
