import asyncio, sys
sys.path.insert(0, '/app')
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as db:
        count = (await db.execute(text('SELECT COUNT(*) FROM blood_stock'))).scalar()
        sample = (await db.execute(text('SELECT blood_group, units_available FROM blood_stock LIMIT 8'))).fetchall()
        print(f'Total records: {count}')
        for row in sample:
            print(f'  {row[0]}: {row[1]} units')

asyncio.run(check())
