from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.core.config import get_settings
from backend.db.session import get_db
from backend.repositories.settings_repository import SettingsRepository
from backend.services.ai.local_whisper_provider import LocalWhisperProvider, check_ffmpeg

router = APIRouter(prefix="/system", tags=["Diagnóstico y Sistema"])
settings = get_settings()


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_ok = True
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    return {
        "status": "healthy" if db_ok else "unhealthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "database": "connected" if db_ok else "disconnected",
    }


@router.get("/status")
def system_ai_status(db: Session = Depends(get_db)):
    repo = SettingsRepository(db)
    sys_settings = repo.get_active_settings()

    local_provider = LocalWhisperProvider(model_name=sys_settings.local_model_name)
    local_status = local_provider.check_availability()
    ffmpeg_detected = check_ffmpeg()

    return {
        "execution_mode": sys_settings.execution_mode,
        "active_model": sys_settings.local_model_name if sys_settings.execution_mode == "local" else sys_settings.remote_model_name,
        "local_whisper": {
            "available": local_status.available,
            "model_configured": sys_settings.local_model_name,
            "device": settings.WHISPER_DEVICE,
            "details": local_status.details,
            "error": local_status.error,
        },
        "remote_api": {
            "enabled": sys_settings.remote_provider_enabled,
            "endpoint": sys_settings.remote_endpoint,
            "model": sys_settings.remote_model_name,
            "key_configured": bool(sys_settings.remote_api_key_masked),
        },
        "system_requirements": {
            "ffmpeg_installed": ffmpeg_detected,
            "ffmpeg_path": settings.FFMPEG_PATH or "system_path",
            "recommended_gpu": "NVIDIA RTX 3060+ / RTX 4090 con 6GB+ VRAM",
            "recommended_ram": "16 GB RAM",
            "note": "El modelo Whisper 'small' o 'base' se ejecuta localmente en CPU o GPU CUDA.",
        },
    }
