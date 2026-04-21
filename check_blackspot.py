import pathlib, re

#  1. BlackSpots: convert severity + road type buttons to dropdowns 
p = pathlib.Path('apps/web/src/pages/BlackSpots/BlackSpotPage.tsx')
src = p.read_text(encoding='utf-8')

# Find the filter buttons section and replace with dropdowns
# Replace severity buttons [ALL, HIGH, MEDIUM, LOW]
old_sev = re.search(r'\{.*?\["ALL","HIGH","MEDIUM","LOW"\]\.map.*?\}\)', src, re.DOTALL)
if old_sev:
    print("Found severity buttons at:", old_sev.start(), old_sev.end())
else:
    print("Severity buttons pattern not found")
    # Show what filter-related code exists
    idx = src.find('filter')
    print(repr(src[idx:idx+500]))
