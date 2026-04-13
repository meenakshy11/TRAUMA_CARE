from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        *settings.CORS_ORIGINS,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)
app.include_router(ws_router)


_CORS_ORIGINS = {
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
}


@app.exception_handler(Exception)
async def _cors_safe_exception_handler(request: Request, exc: Exception):
    """Re-raise after injecting CORS headers so browsers don't mask real errors."""
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in _CORS_ORIGINS or any(o in origin for o in _CORS_ORIGINS):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    status = getattr(exc, "status_code", 500)
    detail = getattr(exc, "detail", str(exc))
    return JSONResponse({"detail": detail}, status_code=status, headers=headers)


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.APP_NAME}
