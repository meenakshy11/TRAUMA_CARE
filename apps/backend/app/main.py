from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.api.v1.router import api_router
from app.api.v1.websocket import router as ws_router
from app.db.session import engine, AsyncSessionLocal
from app.db.base import Base
from app.core.middleware import RequestLoggingMiddleware
import app.models


@asynccontextmanager
async def lifespan(application: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        from app.db.init_db import init_db
        await init_db(session)
        await session.commit()
    print("Trauma Platform API started.")
    yield
    await engine.dispose()
    print("Trauma Platform API shutdown.")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Integrated Trauma Care Platform - Government of Kerala",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)
app.include_router(ws_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.APP_NAME}
