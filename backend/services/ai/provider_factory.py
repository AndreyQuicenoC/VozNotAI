import logging
from typing import Optional
from sqlalchemy.orm import Session
from backend.core.config import get_settings
from backend.core.exceptions import TranscriptionProviderException
from backend.models.system_settings import SystemSettings
from backend.repositories.settings_repository import SettingsRepository
from backend.services.ai.base_provider import TranscriptionProvider
from backend.services.ai.local_whisper_provider import LocalWhisperProvider
from backend.services.ai.remote_provider import RemoteTranscriptionProvider

logger = logging.getLogger("voznotai.provider_factory")
settings = get_settings()


class ProviderFactory:
    @staticmethod
    def get_provider(db: Optional[Session] = None) -> TranscriptionProvider:
        """Constructs and returns the active transcription provider based on system settings."""
        if db:
            repo = SettingsRepository(db)
            sys_settings = repo.get_active_settings()
            mode = sys_settings.execution_mode.lower()
            local_model = sys_settings.local_model_name
            remote_enabled = sys_settings.remote_provider_enabled
            remote_endpoint = sys_settings.remote_endpoint
            remote_model = sys_settings.remote_model_name
            # Remote key: use environment variable or stored key
            remote_key = settings.TRANSCRIPTION_API_KEY
        else:
            mode = settings.TRANSCRIPTION_MODE.lower()
            local_model = settings.LOCAL_WHISPER_MODEL
            remote_enabled = bool(settings.TRANSCRIPTION_API_KEY)
            remote_endpoint = settings.TRANSCRIPTION_API_BASE_URL
            remote_model = settings.TRANSCRIPTION_API_MODEL
            remote_key = settings.TRANSCRIPTION_API_KEY

        if mode == "local":
            logger.info("Factory: Creando LocalWhisperProvider con modelo '%s'", local_model)
            return LocalWhisperProvider(model_name=local_model)

        elif mode == "api":
            logger.info("Factory: Verificando configuración para RemoteTranscriptionProvider...")
            if not remote_enabled and not remote_key:
                raise TranscriptionProviderException(
                    detail="El modo de ejecución está fijado en 'api', pero el proveedor remoto no está habilitado o carece de clave API.",
                    provider="remote_api",
                    code="API_PROVIDER_NOT_CONFIGURED",
                )
            return RemoteTranscriptionProvider(
                endpoint=remote_endpoint,
                api_key=remote_key,
                model_name=remote_model,
                timeout=settings.TRANSCRIPTION_API_TIMEOUT,
            )

        else:
            raise TranscriptionProviderException(
                detail=f"Modo de ejecución desconocido: '{mode}'. Se requiere 'local' o 'api'.",
                provider="factory",
                code="UNKNOWN_EXECUTION_MODE",
            )
