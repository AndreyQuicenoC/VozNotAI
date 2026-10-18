import asyncio
import logging
import os
import shutil
import time
from pathlib import Path
from typing import Any, Dict, Optional
from backend.core.config import get_settings
from backend.core.exceptions import TranscriptionProviderException
from backend.services.ai.base_provider import (
    ProviderStatus,
    TranscriptSegment,
    TranscriptionProvider,
    TranscriptionResult,
)

logger = logging.getLogger("voznotai.whisper_local")
settings = get_settings()

# Concurrency lock: ensures 1 task at a time for local inference
_whisper_semaphore = asyncio.Semaphore(1)
_model_cache: Dict[str, Any] = {}


def check_ffmpeg() -> bool:
    """Verifies FFmpeg presence in system PATH or configured path."""
    if settings.FFMPEG_PATH and os.path.exists(settings.FFMPEG_PATH):
        return True
    return shutil.which("ffmpeg") is not None


class LocalWhisperProvider(TranscriptionProvider):
    def __init__(self, model_name: str = "base"):
        self.model_name = model_name
        self.device = settings.WHISPER_DEVICE

    def check_availability(self) -> ProviderStatus:
        ffmpeg_ok = check_ffmpeg()
        try:
            import torch  # noqa: F401
            import whisper  # noqa: F401

            details = f"Motor Whisper local disponible en dispositivo '{self.device}'. FFmpeg: {'Detectado' if ffmpeg_ok else 'No encontrado'}"
            return ProviderStatus(
                available=ffmpeg_ok,
                provider_name="local_whisper",
                model_name=self.model_name,
                details=details,
                ffmpeg_available=ffmpeg_ok,
                error=None if ffmpeg_ok else "FFmpeg no está instalado en el sistema. Es obligatorio para procesar audio local.",
            )
        except ImportError as e:
            return ProviderStatus(
                available=False,
                provider_name="local_whisper",
                model_name=self.model_name,
                details="Dependencias 'openai-whisper' o 'torch' no instaladas en el entorno actual.",
                ffmpeg_available=ffmpeg_ok,
                error=f"Falta paquete de inferencia: {e}. Instale 'requirements-whisper.txt' o active proveedor remoto.",
            )

    def _load_model(self) -> Any:
        import whisper

        if self.model_name not in _model_cache:
            logger.info("Cargando pesos del modelo Whisper local: %s en %s...", self.model_name, self.device)
            model = whisper.load_model(
                self.model_name,
                device=self.device,
                download_root=settings.WHISPER_MODEL_PATH or None,
            )
            _model_cache[self.model_name] = model
        return _model_cache[self.model_name]

    def _sync_transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None,
        task: str = "transcribe",
    ) -> Dict[str, Any]:
        model = self._load_model()
        options: Dict[str, Any] = {"task": task, "verbose": False}
        if language and language.lower() not in ["auto", ""]:
            options["language"] = language.lower()
        return model.transcribe(audio_path, **options)

    async def transcribe(
        self,
        audio_path: Path,
        language: Optional[str] = None,
        task: str = "transcribe",
    ) -> TranscriptionResult:
        status = self.check_availability()
        if not status.available:
            raise TranscriptionProviderException(
                detail=status.error or "Motor Whisper local no disponible",
                provider="local_whisper",
                code="LOCAL_WHISPER_UNAVAILABLE",
            )

        start_time = time.perf_counter()

        # Enforce concurrency limit: 1 task at a time
        async with _whisper_semaphore:
            try:
                # Offload heavy CPU/GPU inference to thread pool
                raw_result = await asyncio.to_thread(
                    self._sync_transcribe,
                    str(audio_path),
                    language,
                    task,
                )
            except Exception as exc:
                logger.error("Error durante inferencia Whisper local: %s", exc)
                raise TranscriptionProviderException(
                    detail=f"Fallo durante la transcripción local: {str(exc)}",
                    provider="local_whisper",
                    code="INFERENCE_FAILED",
                )

        end_time = time.perf_counter()
        processing_ms = int((end_time - start_time) * 1000)

        raw_segments = raw_result.get("segments", [])
        segments = []
        for i, s in enumerate(raw_segments):
            seg_start = float(s.get("start", 0.0))
            seg_end = float(s.get("end", 0.0))
            seg_text = s.get("text", "")
            segments.append(
                TranscriptSegment(
                    id=f"seg-{i+1}",
                    start=seg_start,
                    end=seg_end,
                    text=seg_text,
                    speaker=f"Hablante {1 + (i % 2)}",
                    speakerRole="Interlocutor",
                    confidence=float(s.get("confidence", 0.95)) if "confidence" in s else 0.95,
                )
            )

        total_audio_duration = 0.0
        if segments:
            total_audio_duration = segments[-1].end

        detected_lang = raw_result.get("language", language or "es")
        full_text = raw_result.get("text", "").strip()

        return TranscriptionResult(
            transcript_text=full_text,
            segments=segments,
            duration_seconds=total_audio_duration,
            processing_duration_ms=processing_ms,
            language=detected_lang,
            model_name=self.model_name,
            provider_name="local_whisper",
        )
