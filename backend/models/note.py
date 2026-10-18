from typing import Optional
from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base import Base, TimestampMixin


class Note(Base, TimestampMixin):
    __tablename__ = "notes"

    owner_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    conversation_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("conversations.id", ondelete="SET NULL"), index=True, nullable=True)
    transcription_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("transcriptions.id", ondelete="SET NULL"), index=True, nullable=True)
    segment_start: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    segment_end: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="Idea Clave", nullable=False)
    tags: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Comma-separated tags

    # Relationships
    owner = relationship("User", back_populates="notes")
    conversation = relationship("Conversation", back_populates="notes")
    transcription = relationship("Transcription", back_populates="notes")
