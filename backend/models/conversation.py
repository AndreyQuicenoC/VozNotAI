from datetime import datetime
from typing import Optional, List
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base import Base, TimestampMixin


class Conversation(Base, TimestampMixin):
    __tablename__ = "conversations"

    owner_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), default="Nueva Conversación", nullable=False)
    tags: Mapped[str] = mapped_column(String(400), default="", nullable=False)
    archived_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    owner = relationship("User", back_populates="conversations")
    audio_assets = relationship("AudioAsset", back_populates="conversation", cascade="all, delete-orphan")
    transcriptions = relationship("Transcription", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")
    notes = relationship("Note", back_populates="conversation")
