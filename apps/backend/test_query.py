"""Test the exact SQLAlchemy query the endpoint uses to find the 500 error."""
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db.session import AsyncSessionLocal
from app.services.blackspot_service import list_blackspots

async def test():
    async with AsyncSessionLocal() as db:
        try:
            spots = await list_blackspots(db)
            print(f"Query OK — {len(spots)} results")
            for s in spots[:3]:
                print(f"  {s.district:22s} | {s.priority:5s} | {s.road_number:8s} | {s.severity}")
        except Exception as e:
            import traceback
            print(f"QUERY FAILED: {type(e).__name__}: {e}")
            traceback.print_exc()

asyncio.run(test())
