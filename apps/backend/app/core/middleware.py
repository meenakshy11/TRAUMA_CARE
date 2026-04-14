import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        correlation_id = str(uuid.uuid4())[:8]
        request.state.correlation_id = correlation_id
        response = await call_next(request)
        duration = round((time.time() - start) * 1000, 2)
        print(f"[{correlation_id}] {request.method} {request.url.path} -> {response.status_code} ({duration}ms)")
        return response
