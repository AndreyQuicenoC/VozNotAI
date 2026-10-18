from decimal import Decimal
from typing import Any, Dict, Optional
from sqlalchemy import Boolean, Integer, JSON, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column
from backend.db.base import Base, TimestampMixin


class SystemSettings(Base, TimestampMixin):
    __tablename__ = "system_settings"

    execution_mode: Mapped[str] = mapped_column(String(20), default="local", nullable=False)  # "local", "api"
    local_model_name: Mapped[str] = mapped_column(String(50), default="base", nullable=False)
    local_model_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    remote_provider_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    remote_provider_name: Mapped[str] = mapped_column(String(100), default="OpenAI Compatible", nullable=False)
    remote_endpoint: Mapped[str] = mapped_column(String(255), default="https://api.openai.com/v1", nullable=False)
    remote_model_name: Mapped[str] = mapped_column(String(50), default="whisper-1", nullable=False)
    remote_api_key_masked: Mapped[str] = mapped_column(String(100), default="", nullable=False)
    usage_rate_per_audio_minute: Mapped[Decimal] = mapped_column(Numeric(10, 4), default=Decimal("0.0060"), nullable=False)
    maximum_audio_duration_seconds: Mapped[int] = mapped_column(Integer, default=120, nullable=False)
    maximum_upload_size_bytes: Mapped[int] = mapped_column(Integer, default=26214400, nullable=False)
    per_user_limits: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    updated_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
