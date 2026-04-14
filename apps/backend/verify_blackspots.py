import asyncio
import asyncpg

async def verify():
    conn = await asyncpg.connect("postgresql://trauma:trauma@localhost:5432/trauma_db")
    total = await conn.fetchval("SELECT COUNT(*) FROM black_spots")
    rows  = await conn.fetch(
        "SELECT district, priority, location, road_name, road_number, road_type, severity "
        "FROM black_spots ORDER BY priority, district LIMIT 10"
    )
    print(f"Total rows in black_spots: {total}")
    print()
    for r in rows:
        print(f"  {r['district']:22s} | {r['priority']:5s} | {str(r['road_number']):8s} | "
              f"{str(r['road_type']):4s} | {str(r['severity']):8s} | {r['location'][:40]}")
    await conn.close()

asyncio.run(verify())
