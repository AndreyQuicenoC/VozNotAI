import time
from collections import defaultdict
from typing import Dict, List
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests_per_minute: int = 120):
        super().__init__(app)
        self.max_requests = max_requests_per_minute
        self.window_seconds = 60
        self.clients: Dict[str, List[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Exclude static assets or health checks from strict rate limiting
        if request.url.path.startswith("/api/v1/system/health"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # Clean old timestamps
        timestamps = [ts for ts in self.clients[client_ip] if now - ts < self.window_seconds]
        if len(timestamps) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": "Demasiadas solicitudes. Por favor espere un momento antes de reintentar.",
                },
                headers={"Retry-After": "60"},
            )

        timestamps.append(now)
        self.clients[client_ip] = timestamps
        return await call_next(request)
