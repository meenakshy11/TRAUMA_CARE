# -*- coding: utf-8 -*-
"""debug_exception.py — find exact exception causing 500 on /blackspots"""
import sys, os, traceback
os.environ['PYTHONUTF8'] = '1'
sys.stdout.reconfigure(encoding='utf-8')

from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

import app.main as main_module
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

app = main_module.app

caught = []

@app.exception_handler(Exception)
async def debug_handler(request: Request, exc: Exception):
    info = {
        'type': type(exc).__name__,
        'repr': repr(exc)[:300],
        'status_code': getattr(exc, 'status_code', None),
        'detail': getattr(exc, 'detail', None),
    }
    caught.append(info)
    traceback.print_exc()
    return JSONResponse({'debug': info}, status_code=500)

client = TestClient(app, raise_server_exceptions=False)

try:
    # Login
    resp = client.post('/api/v1/auth/login', json={
        'email': 'admin@trauma.kerala.gov.in',
        'password': 'Admin@1234'
    })
    print(f'Login: {resp.status_code}')
    data = resp.json()
    token = data.get('access_token', '')
    if not token:
        print('No token! resp:', data)
        sys.exit(1)

    # Get blackspots
    resp2 = client.get('/api/v1/blackspots', headers={'Authorization': f'Bearer {token}'})
    print(f'Blackspots: {resp2.status_code}')
    print(f'Body: {resp2.text[:500]}')

except Exception as e:
    print(f'RAISED: {type(e).__name__}: {e}')
    traceback.print_exc()

print('Caught list:', caught)
