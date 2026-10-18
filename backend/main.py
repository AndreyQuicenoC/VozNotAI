import logging
from contextlib import asynccontextmanager

try:
    import truststore

    truststore.inject_into_ssl()
except ImportError:
    pass
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.api.v1.router import api_v1_router
from backend.core.config import get_settings
from backend.core.exceptions import DomainException
from backend.db.init_db import init_db
from backend.db.session import SessionLocal
from backend.middleware.rate_limiter import RateLimiterMiddleware
from backend.middleware.security_headers import SecurityHeadersMiddleware
from backend.services.ai.local_whisper_provider import check_ffmpeg

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("voznotai.main")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Iniciando servicio VozNotAI API (v%s)...", settings.APP_VERSION)
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()

    ffmpeg_detected = check_ffmpeg()
    if ffmpeg_detected:
        logger.info("FFmpeg detectado correctamente en el entorno de ejecución.")
    else:
        logger.warning(
            "AVISO: FFmpeg no fue detectado en PATH. Para transcripción local Whisper, instale FFmpeg en el sistema."
        )

    yield

    # Shutdown actions
    logger.info("Cerrando servicio VozNotAI API...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Plataforma de Transcripción Whisper, Conversaciones Persistentes y Medición de IA",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

# 1. Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# 2. Rate Limiting Middleware
app.add_middleware(RateLimiterMiddleware, max_requests_per_minute=120)

# 3. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Exception Handlers
@app.exception_handler(DomainException)
async def domain_exception_handler(request: Request, exc: DomainException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"code": exc.code, "message": exc.message, "details": exc.details},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        errors.append(f"{loc}: {err.get('msg')}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"code": "VALIDATION_ERROR", "message": "Datos de entrada no válidos", "errors": errors},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Excepción no controlada: %s", exc)
    if settings.DEBUG:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"code": "INTERNAL_SERVER_ERROR", "message": str(exc)},
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"code": "INTERNAL_SERVER_ERROR", "message": "Ocurrió un error interno en el servidor."},
    )


# Mount API Routers
app.include_router(api_v1_router, prefix="/api")


@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "documentation": "/docs" if not settings.is_production else "restricted",
        "api_v1": "/api/v1",
    }
