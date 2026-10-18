from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    conversation_id: Optional[str] = None
    transcription_id: Optional[str] = None
    segment_start: Optional[float] = None
    segment_end: Optional[float] = None
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    category: str = Field(default="Idea Clave", max_length=100)
    tags: Optional[str] = Field(None, max_length=255)


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[str] = Field(None, max_length=255)


class NoteResponse(BaseModel):
    id: str
    owner_user_id: str
    conversation_id: Optional[str] = None
    transcription_id: Optional[str] = None
    segment_start: Optional[float] = None
    segment_end: Optional[float] = None
    title: str
    content: str
    category: str
    tags: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
