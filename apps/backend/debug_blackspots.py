# -*- coding: utf-8 -*-
"""debug_blackspots.py — run this to find the exact 500 cause"""
import asyncio, sys, traceback, os
os.environ['PYTHONUTF8'] = '1'

from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

import httpx


async def main():
    async with httpx.AsyncClient(base_url='http://localhost:8000', timeout=10) as client:
        # Login
        r = await client.post('/api/v1/auth/login', json={
            'email': 'admin@trauma.kerala.gov.in',
            'password': 'Admin@1234'
        })
        print(f'Login: {r.status_code}')
        if r.status_code != 200:
            print('Login failed:', r.text)
            return

        token = r.json()['access_token']

        # Call blackspots
        r2 = await client.get(
            '/api/v1/blackspots',
            headers={'Authorization': f'Bearer {token}'}
        )
        print(f'Blackspots: {r2.status_code}')
        print('Body:', r2.text[:1000])

        # Also check the /api/docs to see the OpenAPI spec for clues
        r3 = await client.get('/api/docs')
        print(f'\n/api/docs: {r3.status_code}')


asyncio.run(main())
