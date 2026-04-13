"""
Quick debug: logs into the backend and hits /blackspots to get the real 500 error.
"""
import asyncio, asyncpg, json
import urllib.request, urllib.parse

BASE = "http://localhost:8000/api/v1"

def post_json(url, payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        r = urllib.request.urlopen(req, timeout=10)
        return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
    except Exception as e:
        return None, str(e)

def get_json(url, token=None):
    headers = {"Origin": "http://localhost:5173"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    try:
        r = urllib.request.urlopen(req, timeout=10)
        return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read()
        try:
            body = json.loads(body)
        except Exception:
            body = body.decode(errors="replace")
        return e.code, body
    except Exception as e:
        return None, str(e)

# Try a few demo credentials
CREDS = [
    ("admin@trauma.kerala.gov.in",      "Admin@123"),
    ("admin@trauma.kerala.gov.in",      "admin123"),
    ("dispatcher@trauma.kerala.gov.in", "Dispatch@123"),
    ("govt@trauma.kerala.gov.in",       "Govt@123"),
    ("admin",                           "admin"),
]

token = None
for email, pwd in CREDS:
    status, body = post_json(f"{BASE}/auth/login", {"email": email, "password": pwd})
    print(f"  Login {email}: {status} - {str(body)[:80]}")
    if status == 200 and isinstance(body, dict) and "access_token" in body:
        token = body["access_token"]
        print(f"  --> Got token!")
        break

print()
print(f"Hitting /blackspots with token={'present' if token else 'NONE'}")
status, body = get_json(f"{BASE}/blackspots", token)
print(f"Status: {status}")
print(f"Body: {json.dumps(body, indent=2)[:800] if isinstance(body, (dict,list)) else body[:800]}")
