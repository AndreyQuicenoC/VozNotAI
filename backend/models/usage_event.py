from decimal import Decimal
from typing import Optional
from sqlalchemy import Float, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base import Base, TimestampMixin


class UsageEvent(Base, TimestampMixin):
    __tablename__ = "usage_events"

    owner_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    conversation_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True)
    transcription_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("transcriptions.id", ondelete="SET NULL"), nullable=True)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)  # "local_whisper", "remote_api"
    model_name: Mapped[str] = mapped_column(String(50), nullable=False)
    execution_mode: Mapped[str] = mapped_column(String(20), nullable=False)  # "local", "api"
    audio_duration_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    processing_duration_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    estimated_cost_usd: Mapped[Decimal] = mapped_column(Numeric(10, 4), default=Decimal("0.0000"), nullable=False)
    actual_cost_usd: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 4), nullable=True)
    cost_source: Mapped[str] = mapped_column(String(50), default="configured_rate", nullable=False)  # configured_rate, provider_reported, not_applicable
    status: Mapped[str] = mapped_column(String(30), default="completed", nullable=False)

    # Relationships
    owner = relationship("User", back_populates="usage_events")
