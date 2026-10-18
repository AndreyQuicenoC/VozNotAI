from datetime import datetime
from typing import Any, List, Optional
from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base import Base, TimestampMixin


class Transcription(Base, TimestampMixin):
    __tablename__ = "transcriptions"

    owner_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    conversation_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), index=True, nullable=True)
    audio_asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("audio_assets.id", ondelete="CASCADE"), index=True, nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)  # "local_whisper", "remote_api"
    model_name: Mapped[str] = mapped_column(String(50), nullable=False)
    source_language: Mapped[str] = mapped_column(String(20), default="auto", nullable=False)
    task_type: Mapped[str] = mapped_column(String(30), default="transcribe", nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="pending", index=True, nullable=False)  # pending, validating, processing, completed, failed
    transcript_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    segments: Mapped[Optional[List[Any]]] = mapped_column(JSON, nullable=True)
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    processing_duration_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    owner = relationship("User", back_populates="transcriptions")
    conversation = relationship("Conversation", back_populates="transcriptions")
    audio_asset = relationship("AudioAsset", back_populates="transcriptions")
    notes = relationship("Note", back_populates="transcription")
