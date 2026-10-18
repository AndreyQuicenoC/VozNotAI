from typing import Optional
from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base import Base, TimestampMixin


class AudioAsset(Base, TimestampMixin):
    __tablename__ = "audio_assets"

    owner_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    conversation_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), index=True, nullable=True)
    storage_key: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    media_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA-256
    retention_status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)  # active, purged

    # Relationships
    owner = relationship("User", back_populates="audio_assets")
    conversation = relationship("Conversation", back_populates="audio_assets")
    transcriptions = relationship("Transcription", back_populates="audio_asset", cascade="all, delete-orphan")
