"""Check the actual columns in the black_spots table vs what the ORM expects."""
import asyncio
import asyncpg

async def check():
    conn = await asyncpg.connect("postgresql://postgres:root@localhost:5432/trauma_db")
    
    cols = await conn.fetch("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'black_spots'
        ORDER BY ordinal_position
    """)
    print(f"Columns in black_spots table ({len(cols)} total):")
    for c in cols:
        print(f"  {c['column_name']:30s} {c['data_type']:20s} nullable={c['is_nullable']}")
    
    count = await conn.fetchval("SELECT COUNT(*) FROM black_spots")
    print(f"\nRow count: {count}")
    
    # Try a simple select to see if it works
    try:
        row = await conn.fetchrow("SELECT id, district, priority, location, road_name, road_number, road_type, severity FROM black_spots LIMIT 1")
        print(f"\nSample row: {dict(row)}")
    except Exception as e:
        print(f"\nQuery error: {e}")
    
    await conn.close()

asyncio.run(check())
