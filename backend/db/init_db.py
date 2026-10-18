import logging
from decimal import Decimal
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from backend.core.config import get_settings
from backend.core.security import get_password_hash
from backend.db.base import Base
from backend.db.session import engine, SessionLocal
from backend.models import AuditEvent, SystemSettings, User

logger = logging.getLogger("voznotai.init_db")
settings = get_settings()


def ensure_runtime_columns() -> None:
    """Adds columns introduced after the first local database was created."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    conversation_columns = {column["name"] for column in inspector.get_columns("conversations")}
    with engine.begin() as connection:
        if "preferred_language" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN preferred_language VARCHAR(12) DEFAULT 'auto'"))
        if "tags" not in conversation_columns:
            connection.execute(text("ALTER TABLE conversations ADD COLUMN tags VARCHAR(400) DEFAULT ''"))


def init_db(db: Session) -> None:
    """Initializes tables and seeds necessary default system settings and admin."""
    Base.metadata.create_all(bind=engine)
    ensure_runtime_columns()

    # 1. Initialize or verify SystemSettings
    sys_settings = db.query(SystemSettings).first()
    if not sys_settings:
        logger.info("Initializing default system settings...")
        sys_settings = SystemSettings(
            execution_mode=settings.TRANSCRIPTION_MODE,
            local_model_name=settings.LOCAL_WHISPER_MODEL,
            local_model_available=False,
            remote_provider_enabled=bool(settings.TRANSCRIPTION_API_KEY),
            remote_provider_name="OpenAI Compatible Audio API",
            remote_endpoint=settings.TRANSCRIPTION_API_BASE_URL,
            remote_model_name=settings.TRANSCRIPTION_API_MODEL,
            remote_api_key_masked="********" if settings.TRANSCRIPTION_API_KEY else "",
            usage_rate_per_audio_minute=Decimal(str(settings.USAGE_RATE_PER_MINUTE)),
            maximum_audio_duration_seconds=settings.MAX_AUDIO_DURATION_SECONDS,
            maximum_upload_size_bytes=settings.MAX_UPLOAD_SIZE_BYTES,
            updated_by="system_bootstrap",
        )
        db.add(sys_settings)
        db.commit()
    else:
        sys_settings.execution_mode = settings.TRANSCRIPTION_MODE.lower()
        sys_settings.local_model_name = settings.LOCAL_WHISPER_MODEL
        sys_settings.remote_endpoint = settings.TRANSCRIPTION_API_BASE_URL
        sys_settings.remote_model_name = settings.TRANSCRIPTION_API_MODEL
        sys_settings.remote_provider_enabled = bool(settings.TRANSCRIPTION_API_KEY.strip())
        if settings.TRANSCRIPTION_API_KEY.strip():
            sys_settings.remote_api_key_masked = "********"
        sys_settings.usage_rate_per_audio_minute = Decimal(str(settings.USAGE_RATE_PER_MINUTE))
        sys_settings.maximum_audio_duration_seconds = settings.MAX_AUDIO_DURATION_SECONDS
        sys_settings.maximum_upload_size_bytes = settings.MAX_UPLOAD_SIZE_BYTES
        db.commit()

    # 2. Bootstrap Administrator only when an explicit password is provided.
    # Never invent a known default password or sample conversations.
    admin_email = (settings.ADMIN_BOOTSTRAP_EMAIL or "").lower().strip()
    admin_password = settings.ADMIN_BOOTSTRAP_PASSWORD or ""
    if not admin_email or not admin_password:
        logger.warning(
            "Administrador no creado. Defina ADMIN_BOOTSTRAP_EMAIL y ADMIN_BOOTSTRAP_PASSWORD para el arranque inicial."
        )
        return

    admin_user = db.query(User).filter(User.email == admin_email).first()
    if admin_user:
        return

    logger.info("Creating bootstrap administrator account: %s", admin_email)
    admin_user = User(
        first_name="Administrador",
        last_name="VozNotAI",
        email=admin_email,
        role="admin",
        role_title="Administrador",
        organization="ClustLayer / Eureka Solutions",
        password_hash=get_password_hash(admin_password),
        is_active=True,
        is_verified=True,
        max_minutes_quota=0,
        preferred_mode="local",
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    audit = AuditEvent(
        event_type="SYSTEM_BOOTSTRAP",
        description="Cuenta administrativa inicial creada desde variables de entorno. La contraseña no se registra.",
        user_identifier=admin_user.email,
        severity="info",
    )
    db.add(audit)
    db.commit()


if __name__ == "__main__":
    db = SessionLocal()
    try:
        init_db(db)
        print("Database initialized successfully.")
    finally:
        db.close()
