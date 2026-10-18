import ipaddress
import logging
import socket
import time
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse
import httpx
from backend.core.config import get_settings
from backend.core.exceptions import SSRFDetectedException, TranscriptionProviderException
from backend.services.ai.base_provider import (
    ProviderStatus,
    TranscriptSegment,
    TranscriptionProvider,
    TranscriptionResult,
)

logger = logging.getLogger("voznotai.remote_provider")
settings = get_settings()


def validate_remote_url(url: str, allow_local_for_testing: bool = False) -> None:
    """Strict SSRF validation: ensures endpoint does not target internal infrastructure."""
    parsed = urlparse(url)
    if parsed.scheme not in ["https", "http"]:
        raise SSRFDetectedException("Esquema de URL no permitido. Solo se admite HTTPS o HTTP.")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFDetectedException("Nombre de host no válido en el endpoint remoto.")

    if not allow_local_for_testing:
        if hostname.lower() in ["localhost", "127.0.0.1", "::1", "metadata.google.internal"]:
            raise SSRFDetectedException("Acceso prohibido a endpoints de localhost o loopback.")

        try:
            ip_str = socket.gethostbyname(hostname)
            ip_obj = ipaddress.ip_address(ip_str)
            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local:
                raise SSRFDetectedException("El endpoint remoto resuelve a una dirección de red privada o reservada.")
        except socket.gaierror:
            raise SSRFDetectedException(f"No se pudo resolver el nombre de dominio del endpoint: {hostname}")


class RemoteTranscriptionProvider(TranscriptionProvider):
    def __init__(
        self,
        endpoint: str,
        api_key: str,
        model_name: str = "whisper-1",
        timeout: int = 60,
    ):
        self.endpoint = endpoint.strip()
        self.api_key = api_key.strip()
        self.model_name = model_name
        self.timeout = timeout

    def check_availability(self) -> ProviderStatus:
        if not self.endpoint:
            return ProviderStatus(
                available=False,
                provider_name="remote_api",
                model_name=self.model_name,
                details="Endpoint de API no configurado",
                ffmpeg_available=True,
                error="Falta configurar la URL del endpoint remoto en Ajustes del Sistema.",
            )

        if not self.api_key:
            return ProviderStatus(
                available=False,
                provider_name="remote_api",
                model_name=self.model_name,
                details="Credencial de API no configurada",
                ffmpeg_available=True,
                error="Falta configurar la clave API (API Key) del proveedor externo.",
            )

        try:
            validate_remote_url(self.endpoint, allow_local_for_testing=not settings.is_production)
            return ProviderStatus(
                available=True,
                provider_name="remote_api",
                model_name=self.model_name,
                details=f"Proveedor remoto configurado en: {self.endpoint}",
                ffmpeg_available=True,
            )
        except Exception as e:
            return ProviderStatus(
                available=False,
                provider_name="remote_api",
                model_name=self.model_name,
                details="Validación de endpoint fallida",
                ffmpeg_available=True,
                error=str(e),
            )

    async def transcribe(
        self,
        audio_path: Path,
        language: Optional[str] = None,
        task: str = "transcribe",
    ) -> TranscriptionResult:
        status = self.check_availability()
        if not status.available:
            raise TranscriptionProviderException(
                detail=status.error or "Proveedor remoto no configurado adecuadamente",
                provider="remote_api",
                code="REMOTE_CONFIG_INVALID",
            )

        validate_remote_url(self.endpoint, allow_local_for_testing=not settings.is_production)

        url = self.endpoint.rstrip("/")
        if not url.endswith("/audio/transcriptions"):
            url = f"{url}/audio/transcriptions"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

        start_time = time.perf_counter()

        try:
            with open(audio_path, "rb") as f:
                file_bytes = f.read()

            files = {"file": (audio_path.name, file_bytes, "audio/wav")}
            data = {
                "model": self.model_name,
                "response_format": "verbose_json",
            }
            if language and language.lower() not in ["auto", ""]:
                data["language"] = language.lower()

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=headers, files=files, data=data)

            if response.status_code != 200:
                logger.error("Error HTTP desde proveedor remoto (%d): %s", response.status_code, response.text[:200])
                raise TranscriptionProviderException(
                    detail=f"Proveedor remoto devolvió error {response.status_code}: {response.text[:150]}",
                    provider="remote_api",
                    code=f"HTTP_{response.status_code}",
                )

            res_json = response.json()

        except httpx.TimeoutException:
            raise TranscriptionProviderException(
                detail="Tiempo de espera agotado al conectar con el proveedor externo de transcripción.",
                provider="remote_api",
                code="TIMEOUT",
            )
        except httpx.RequestError as exc:
            raise TranscriptionProviderException(
                detail=f"Error de conexión con el proveedor remoto: {str(exc)}",
                provider="remote_api",
                code="NETWORK_ERROR",
            )

        end_time = time.perf_counter()
        processing_ms = int((end_time - start_time) * 1000)

        full_text = res_json.get("text", "").strip()
        raw_segments = res_json.get("segments", [])
        segments = []
        for i, s in enumerate(raw_segments):
            segments.append(
                TranscriptSegment(
                    id=f"seg-rem-{i+1}",
                    start=float(s.get("start", 0.0)),
                    end=float(s.get("end", 0.0)),
                    text=s.get("text", "").strip(),
                    speaker=f"Hablante {1 + (i % 2)}",
                    speakerRole="Interlocutor",
                    confidence=float(s.get("avg_logprob", 0.95)) if "avg_logprob" in s else 0.95,
                )
            )

        audio_duration = float(res_json.get("duration", segments[-1].end if segments else 0.0))
        detected_lang = res_json.get("language", language or "es")

        return TranscriptionResult(
            transcript_text=full_text,
            segments=segments,
            duration_seconds=audio_duration,
            processing_duration_ms=processing_ms,
            language=detected_lang,
            model_name=self.model_name,
            provider_name="remote_api",
        )
