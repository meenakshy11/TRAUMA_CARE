import pathlib

p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalDetailPage.tsx')
src = p.read_text(encoding='utf-8')

# Remove the badly inserted block
import re
src = re.sub(r'\n\s*\{/\* Blood Bank Stock \*/\}[\s\S]*?\}\s*\}\s*\)', '', src)

# Find the last </div> inside the return statement
# Look for the pattern just before the closing of return
idx = src.rfind('    </div>\n  )\n}')
if idx == -1:
    idx = src.rfind('  )\n}\n\nexport')
    print('Found at export pattern:', idx)
else:
    print('Found at closing div pattern:', idx)

print(repr(src[idx:idx+50]))
