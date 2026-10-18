from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    message_type: str = Field(default="text")


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    owner_user_id: str
    role: str
    content: str
    message_type: str
    transcription_id: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    title: Optional[str] = Field("Nueva Conversación", max_length=200)


class ConversationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    tags: Optional[str] = Field(None, max_length=400)


class AudioAssetResponse(BaseModel):
    id: str
    original_filename: str
    media_type: str
    file_size_bytes: int
    duration_seconds: float
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: str
    owner_user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages_count: int = 0
    audio_assets_count: int = 0
    notes_count: int = 0
    file_size_bytes: int = 0
    tags: str = ""

    class Config:
        from_attributes = True


class ConversationDetailResponse(BaseModel):
    id: str
    owner_user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []
    audio_assets: List[AudioAssetResponse] = []

    class Config:
        from_attributes = True
