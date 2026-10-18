from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.db.base import Base, TimestampMixin, utc_now


class AuditEvent(Base, TimestampMixin):
    __tablename__ = "audit_events"

    event_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # CONFIG_UPDATE, USER_ROLE_CHANGE, AUTH_SUCCESS, TRANSCRIPTION_DISPATCH, etc.
    description: Mapped[str] = mapped_column(Text, nullable=False)
    user_identifier: Mapped[str] = mapped_column(String(100), default="system", nullable=False)
    client_ip: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    resource_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default="info", nullable=False)  # info, warn, error
