import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from backend.core.config import get_settings
from backend.core.exceptions import (
    BusinessRuleViolationException,
    PermissionDeniedException,
    ResourceNotFoundException,
    TranscriptionProviderException,
)
from backend.models import (
    AudioAsset,
    Conversation,
    Message,
    Transcription,
    UsageEvent,
    User,
)
from backend.repositories.audio_repository import AudioRepository
from backend.repositories.conversation_repository import ConversationRepository
from backend.repositories.settings_repository import SettingsRepository
from backend.repositories.transcription_repository import TranscriptionRepository
from backend.repositories.usage_repository import UsageRepository
from backend.services.ai.provider_factory import ProviderFactory
from backend.services.transcription.audio_validator import validate_audio_file
from backend.services.transcription.state_machine import transition_state

logger = logging.getLogger("voznotai.transcription_service")
settings = get_settings()


class TranscriptionService:
    def __init__(self, db: Session):
        self.db = db
        self.transcription_repo = TranscriptionRepository(db)
        self.audio_repo = AudioRepository(db)
        self.conv_repo = ConversationRepository(db)
        self.usage_repo = UsageRepository(db)
        self.settings_repo = SettingsRepository(db)

    async def process_audio_upload(
        self,
        user: User,
        file_bytes: bytes,
        original_filename: str,
        conversation_id: Optional[str] = None,
        language: Optional[str] = None,
    ) -> Tuple[Transcription, Conversation]:
        sys_settings = self.settings_repo.get_active_settings()

        # 1. Validation phase
        clean_name, detected_fmt, duration_est, checksum = validate_audio_file(
            content=file_bytes,
            original_filename=original_filename,
            max_duration_seconds=sys_settings.maximum_audio_duration_seconds,
            max_size_bytes=sys_settings.maximum_upload_size_bytes,
        )

        # 2. Resolve or create Conversation
        conv: Optional[Conversation] = None
        if conversation_id:
            conv = self.conv_repo.get_by_id_and_owner(conversation_id, user.id)
            if not conv:
                raise ResourceNotFoundException("Conversación", conversation_id)
        else:
            conv = Conversation(
                owner_user_id=user.id,
                title=clean_name[:180],
            )
            self.db.add(conv)
            self.db.commit()
            self.db.refresh(conv)

        # 3. Save physical file to isolated storage with sanitized key
        ext = Path(clean_name).suffix.lower()
        storage_key = f"{uuid.uuid4().hex}{ext}"
        storage_path = settings.upload_path / storage_key
        try:
            with open(storage_path, "wb") as f:
                f.write(file_bytes)
        except Exception as e:
            logger.error("Error guardando archivo de audio: %s", e)
            raise BusinessRuleViolationException(f"Error escribiendo archivo en disco: {e}")

        # 4. Create AudioAsset entity
        audio_asset = AudioAsset(
            owner_user_id=user.id,
            conversation_id=conv.id,
            storage_key=storage_key,
            original_filename=clean_name,
            media_type=f"audio/{detected_fmt}",
            file_size_bytes=len(file_bytes),
            duration_seconds=duration_est,
            checksum=checksum,
            retention_status="active",
        )
        self.db.add(audio_asset)
        self.db.commit()
        self.db.refresh(audio_asset)

        # 5. Add user message to conversation thread
        self.conv_repo.add_message(
            conversation_id=conv.id,
            owner_user_id=user.id,
            role="user",
            content=f"Audio cargado para transcripción: {clean_name}",
            message_type="transcription_request",
            metadata_json={"audio_asset_id": audio_asset.id, "file_size": len(file_bytes)},
        )

        # 6. Initialize Transcription in 'pending' state
        provider_instance = ProviderFactory.get_provider(self.db)
        execution_mode = sys_settings.execution_mode
        model_name = sys_settings.local_model_name if execution_mode == "local" else sys_settings.remote_model_name
        provider_name = "local_whisper" if execution_mode == "local" else "remote_api"

        transcription = Transcription(
            owner_user_id=user.id,
            conversation_id=conv.id,
            audio_asset_id=audio_asset.id,
            provider=provider_name,
            model_name=model_name,
            source_language=language or "auto",
            task_type="transcribe",
            status="pending",
            duration_seconds=duration_est,
        )
        self.db.add(transcription)
        self.db.commit()
        self.db.refresh(transcription)

        # State machine transition: pending -> validating -> processing
        transcription.status = transition_state(transcription.status, "validating")
        transcription.status = transition_state(transcription.status, "processing")
        self.db.commit()

        # 7. Execute Transcription via Strategy Provider
        try:
            result = await provider_instance.transcribe(
                audio_path=storage_path,
                language=language,
                task="transcribe",
            )

            # Success transition
            transcription.status = transition_state(transcription.status, "completed")
            transcription.transcript_text = result.transcript_text
            transcription.segments = [s.to_dict() for s in result.segments]
            transcription.duration_seconds = result.duration_seconds or duration_est or 1.0
            transcription.processing_duration_ms = result.processing_duration_ms
            transcription.source_language = result.language
            transcription.completed_at = datetime.now(timezone.utc)
            audio_asset.duration_seconds = transcription.duration_seconds

            # 8. Add assistant message with result
            self.conv_repo.add_message(
                conversation_id=conv.id,
                owner_user_id=user.id,
                role="assistant",
                content=result.transcript_text,
                message_type="transcription_result",
                transcription_id=transcription.id,
                metadata_json={
                    "duration_seconds": transcription.duration_seconds,
                    "processing_duration_ms": result.processing_duration_ms,
                    "segments_count": len(result.segments),
                    "model": model_name,
                    "provider": provider_name,
                },
            )

            # 9. Register UsageEvent with exact Decimal cost calculation
            rate_per_min = sys_settings.usage_rate_per_audio_minute
            audio_mins = Decimal(str(transcription.duration_seconds)) / Decimal("60.0")
            estimated_cost = Decimal(str(round(audio_mins * rate_per_min, 4)))

            usage_event = UsageEvent(
                owner_user_id=user.id,
                conversation_id=conv.id,
                transcription_id=transcription.id,
                provider=provider_name,
                model_name=model_name,
                execution_mode=execution_mode,
                audio_duration_seconds=transcription.duration_seconds,
                processing_duration_ms=result.processing_duration_ms,
                estimated_cost_usd=estimated_cost,
                actual_cost_usd=None if execution_mode == "local" else estimated_cost,
                cost_source="configured_rate",
                status="completed",
            )
            self.db.add(usage_event)
            self.db.commit()
            self.db.refresh(transcription)

            return transcription, conv

        except Exception as exc:
            logger.error("Fallo durante transcripción: %s", exc)
            transcription.status = transition_state(transcription.status, "failed")
            transcription.error_code = str(exc)[:90]
            self.db.commit()

            # Record failed usage event
            usage_event = UsageEvent(
                owner_user_id=user.id,
                conversation_id=conv.id,
                transcription_id=transcription.id,
                provider=provider_name,
                model_name=model_name,
                execution_mode=execution_mode,
                audio_duration_seconds=duration_est,
                processing_duration_ms=0,
                estimated_cost_usd=Decimal("0.0000"),
                actual_cost_usd=None,
                cost_source="not_applicable",
                status="failed",
            )
            self.db.add(usage_event)
            self.db.commit()

            if isinstance(exc, TranscriptionProviderException):
                raise exc
            raise BusinessRuleViolationException(f"Error procesando audio: {str(exc)}")

    def export_transcription(self, transcription: Transcription, export_format: str) -> str:
        """Formats transcript as TXT, SRT, VTT, or JSON."""
        fmt = export_format.lower()
        if fmt == "txt":
            return transcription.transcript_text or ""
        elif fmt == "json":
            import json
            return json.dumps(
                {
                    "id": transcription.id,
                    "text": transcription.transcript_text,
                    "segments": transcription.segments or [],
                    "duration_seconds": transcription.duration_seconds,
                },
                indent=2,
            )
        elif fmt in ["srt", "vtt"]:
            lines = []
            if fmt == "vtt":
                lines.append("WEBVTT\n")
            segments = transcription.segments or []
            for i, seg in enumerate(segments):
                idx = i + 1
                start = float(seg.get("start", 0.0))
                end = float(seg.get("end", 0.0))
                text = seg.get("text", "")
                speaker = seg.get("speaker", "")

                start_str = self._format_ts(start, is_vtt=(fmt == "vtt"))
                end_str = self._format_ts(end, is_vtt=(fmt == "vtt"))

                if fmt == "srt":
                    lines.append(f"{idx}\n{start_str} --> {end_str}\n{speaker + ': ' if speaker else ''}{text}\n")
                else:
                    lines.append(f"{idx}\n{start_str} --> {end_str}\n{speaker + ': ' if speaker else ''}{text}\n")
            return "\n".join(lines)
        else:
            raise BusinessRuleViolationException(f"Formato de exportación no soportado: '{export_format}'")

    @staticmethod
    def _format_ts(seconds: float, is_vtt: bool = False) -> str:
        hrs = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int(round((seconds - int(seconds)) * 1000))
        sep = "." if is_vtt else ","
        return f"{hrs:02d}:{mins:02d}:{secs:02d}{sep}{millis:03d}"
