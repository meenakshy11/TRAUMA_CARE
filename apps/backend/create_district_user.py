import asyncio, sys
sys.path.insert(0, '/app')
from app.db.session import AsyncSessionLocal
from app.services.auth_service import create_user
from app.core.constants import UserRole
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as db:
        u = await create_user(db, email='gov.kozhikode@trauma.demo', password='Gov@1234', full_name='District Officer Kozhikode', role=UserRole.GOVERNMENT)
        await db.execute(text("UPDATE users SET district='Kozhikode' WHERE email='gov.kozhikode@trauma.demo'"))
        await db.commit()
        print('Created district officer for Kozhikode')

asyncio.run(main())
