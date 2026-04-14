import urllib.request

req = urllib.request.Request(
    'http://localhost:8000/api/v1/blackspots',
    headers={'Origin': 'http://localhost:5173'}
)
try:
    r = urllib.request.urlopen(req, timeout=5)
    print('Status:', r.status)
    print('CORS header:', r.headers.get('Access-Control-Allow-Origin'))
except urllib.error.HTTPError as e:
    print('Status:', e.code)
    print('CORS header:', e.headers.get('Access-Control-Allow-Origin'))
    print('Response body:', e.read(200))
except Exception as e:
    print('Error:', type(e).__name__, str(e)[:300])
