import pathlib
src = pathlib.Path('apps/web/src/pages/Analytics/AnalyticsDashboardPage.tsx').read_text(encoding='utf-8')
idx = src.find('label:')
while idx != -1:
    snippet = src[idx:idx+60]
    if 'Performance' in snippet or 'Road' in snippet:
        print(repr(snippet))
    idx = src.find('label:', idx+1)
