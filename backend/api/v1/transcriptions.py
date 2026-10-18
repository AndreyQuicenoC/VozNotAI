from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy.orm import Session
from backend.api.deps import get_current_user
from backend.core.config import get_settings
from backend.core.exceptions import ResourceNotFoundException
from backend.db.session import get_db
from backend.models.user import User
from backend.repositories.audio_repository import AudioRepository
from backend.repositories.transcription_repository import TranscriptionRepository
from backend.schemas.transcription import (
    TranscriptionExportResponse,
    TranscriptionResponse,
)
from backend.services.transcription.transcription_service import TranscriptionService

router = APIRouter(prefix="/transcriptions", tags=["Transcripciones"])
settings = get_settings()


@router.get("", response_model=list[TranscriptionResponse])
def list_transcriptions(
    conversation_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = TranscriptionRepository(db)
    if conversation_id:
        rows = repo.list_by_conversation(conversation_id, current_user.id)
    else:
        rows = repo.list_by_owner(current_user.id)
    return [TranscriptionResponse.model_validate(row) for row in rows]


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_audio_and_transcribe(
    file: UploadFile = File(...),
    conversation_id: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = TranscriptionService(db)
    file_bytes = await file.read()
    transcription, conv = await service.process_audio_upload(
        user=current_user,
        file_bytes=file_bytes,
        original_filename=file.filename or "audio.wav",
        conversation_id=conversation_id,
        language=language,
    )
    return {
        "transcription": TranscriptionResponse.model_validate(transcription),
        "conversation_id": conv.id,
        "conversation_title": conv.title,
    }


@router.get("/{id}", response_model=TranscriptionResponse)
def get_transcription(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = TranscriptionRepository(db)
    transcription = repo.get_by_id_and_owner(id, current_user.id)
    if not transcription:
        raise ResourceNotFoundException("Transcripción", id)
    return TranscriptionResponse.model_validate(transcription)


@router.get("/{id}/export")
def export_transcription(
    id: str,
    format: str = Query("txt", pattern="^(txt|srt|vtt|json)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = TranscriptionRepository(db)
    transcription = repo.get_by_id_and_owner(id, current_user.id)
    if not transcription:
        raise ResourceNotFoundException("Transcripción", id)

    service = TranscriptionService(db)
    content = service.export_transcription(transcription, format)
    filename = f"transcripcion_{transcription.id[:8]}.{format}"

    media_type = "text/plain" if format in ["txt", "srt", "vtt"] else "application/json"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return PlainTextResponse(content=content, media_type=media_type, headers=headers)


@router.get("/{id}/audio")
def stream_audio(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trans_repo = TranscriptionRepository(db)
    transcription = trans_repo.get_by_id_and_owner(id, current_user.id)
    if not transcription:
        raise ResourceNotFoundException("Transcripción", id)

    audio_repo = AudioRepository(db)
    audio = audio_repo.get_by_id_and_owner(transcription.audio_asset_id, current_user.id)
    if not audio:
        raise ResourceNotFoundException("Archivo de audio", transcription.audio_asset_id)

    file_path = settings.upload_path / audio.storage_key
    if not file_path.exists():
        raise ResourceNotFoundException("Archivo físico en almacenamiento", audio.storage_key)

    return FileResponse(
        path=str(file_path),
        media_type=audio.media_type,
        filename=audio.original_filename,
    )
