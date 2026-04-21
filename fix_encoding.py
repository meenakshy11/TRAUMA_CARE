import pathlib

files = [
    'apps/web/src/pages/Analytics/AnalyticsDashboardPage.tsx',
    'apps/web/src/pages/BlackSpots/BlackSpotPage.tsx',
    'apps/web/src/components/Layout/TopBar.tsx',
    'apps/web/src/pages/Incidents/IncidentListPage.tsx',
    'apps/web/src/pages/Hospitals/HospitalListPage.tsx',
]

for f in files:
    p = pathlib.Path(f)
    try:
        # Try reading as utf-8 first
        src = p.read_text(encoding='utf-8')
        p.write_text(src, encoding='utf-8')
        print(f'OK (utf-8): {f}')
    except UnicodeDecodeError:
        # File has encoding corruption - read as latin-1 and fix
        src = p.read_text(encoding='latin-1')
        # Fix common corruptions
        src = src.replace('\x9f\x93\x8a', '')
        src = src.replace('\x9f\x9a\x97', '')
        src = src.replace('\x9f\x94\xb4', '')
        src = src.replace('\x9f\x9f\xa0', '')
        src = src.replace('\x9f\x9f\xa1', '')
        src = src.replace('\x9f\x9f\xa2', '')
        src = src.replace('\x9f\x94\xb5', '')
        src = src.replace('\xe2\x80\x94', '—')
        p.write_text(src, encoding='utf-8')
        print(f'FIXED (latin-1utf-8): {f}')
