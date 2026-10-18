from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, Field


class TranscriptSegmentSchema(BaseModel):
    id: str
    start: float
    end: float
    text: str
    speaker: Optional[str] = None
    speakerRole: Optional[str] = None
    confidence: Optional[float] = None


class TranscriptionResponse(BaseModel):
    id: str
    conversation_id: Optional[str] = None
    audio_asset_id: str
    provider: str
    model_name: str
    source_language: str
    task_type: str
    status: str
    transcript_text: Optional[str] = None
    segments: Optional[List[TranscriptSegmentSchema]] = None
    duration_seconds: float
    processing_duration_ms: int
    error_code: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TranscriptionExportResponse(BaseModel):
    id: str
    format: str  # txt, srt, vtt, json
    content: str
    filename: str
