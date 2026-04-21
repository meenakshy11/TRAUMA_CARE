import pathlib

p = pathlib.Path('apps/web/src/pages/Analytics/AnalyticsDashboardPage.tsx')
src = p.read_text(encoding='utf-8')

# Fix corrupted emoji in section tabs - replace all variations
import re
# Remove any emoji before Performance and Road Safety labels
src = re.sub(r'label:\s*["\'].*?Performance.*?["\']', 'label: "Performance"', src)
src = re.sub(r'label:\s*["\'].*?Road Safety.*?["\']', 'label: "Road Safety"', src)

# Fix corrupted text in subtitle
src = re.sub(r'Golden Hour compliance.*?Kerala', 
             'Golden Hour compliance  Response metrics  Road Safety Intelligence — Kerala', 
             src)

# Fix District Performance Matrix title
src = re.sub(r'District Performance Matrix.*?Districts',
             'District Performance Matrix — All 14 Districts',
             src)

p.write_text(src, encoding='utf-8')
print('Fixed')
