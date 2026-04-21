import pathlib
p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalDetailPage.tsx')
src = p.read_text(encoding='utf-8')
# Find the return statement
idx = src.find('return (')
print('return starts at:', idx)
# Show lines 140-160
lines = src.split('\n')
for i, line in enumerate(lines[145:165], start=146):
    print(f'{i}: {repr(line)}')
