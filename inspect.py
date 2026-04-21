import pathlib

p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalDetailPage.tsx')
src = p.read_text(encoding='utf-8')

# Get everything up to the blood section we added
idx = src.find('\n        {/* Blood Bank Stock */}')
if idx == -1:
    print('Blood section not found, showing end:')
    print(repr(src[-300:]))
else:
    # Clean version - everything before blood section
    clean = src[:idx]
    print('Clean content ends with:')
    print(repr(clean[-200:]))
