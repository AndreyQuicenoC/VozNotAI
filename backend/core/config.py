from functools import lru_cache
from pathlib import Path
from typing import List, Optional
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # Application
    APP_NAME: str = "VozNotAI"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    APP_SECRET_KEY: str = Field(
        default="voznotai-insecure-dev-secret-key-change-in-production-min-32-chars",
        description="Cryptographic secret key for token signing and encryption",
    )
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./voznotai.db",
        description="SQLAlchemy database connection string (SQLite for dev, PostgreSQL for prod)",
    )

    # Security & CORS
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    RESET_TOKEN_TTL_MINUTES: int = 30

    # Administrative Bootstrap
    ADMIN_BOOTSTRAP_EMAIL: str = "andrey.quiceno@clustlayer.com"
    ADMIN_BOOTSTRAP_PASSWORD: str = ""

    # Audio & Ingestion Constraints
    MAX_AUDIO_DURATION_SECONDS: int = 120
    MAX_UPLOAD_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    ALLOWED_AUDIO_FORMATS: List[str] = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/ogg", "audio/flac"]
    ALLOWED_EXTENSIONS: List[str] = [".mp3", ".wav", ".m4a", ".flac", ".ogg"]
    UPLOAD_DIR: str = "./uploads"

    # AI & Whisper Engine
    TRANSCRIPTION_MODE: str = "local"  # "local" | "api"
    LOCAL_WHISPER_MODEL: str = "base"  # "base" | "small"
    WHISPER_DEVICE: str = "cpu"        # "cpu" | "cuda"
    WHISPER_MODEL_PATH: Optional[str] = None
    FFMPEG_PATH: Optional[str] = None

    # Remote API Provider (When execution_mode == "api")
    TRANSCRIPTION_API_BASE_URL: str = "https://api.openai.com/v1"
    TRANSCRIPTION_API_KEY: str = ""
    TRANSCRIPTION_API_MODEL: str = "whisper-1"
    TRANSCRIPTION_API_TIMEOUT: int = 60

    # Usage & Cost Transparency
    USAGE_RATE_PER_MINUTE: float = 0.006  # Reference rate USD per audio minute

    # SMTP Configuration (Optional in local dev)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "no-reply@voznotai.clustlayer.com"

    @field_validator("WHISPER_MODEL_PATH", "FFMPEG_PATH", mode="before")
    @classmethod
    def empty_optional_path(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator("APP_SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:
        if len(v) < 32:
            raise ValueError("APP_SECRET_KEY must be at least 32 characters long.")
        return v

    @model_validator(mode="after")
    def reject_known_dev_secret_in_production(self) -> "Settings":
        if self.is_production and "insecure-dev-secret" in self.APP_SECRET_KEY:
            raise ValueError("Defina APP_SECRET_KEY propio antes de ejecutar en producción.")
        return self

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    @property
    def upload_path(self) -> Path:
        p = Path(self.UPLOAD_DIR).resolve()
        p.mkdir(parents=True, exist_ok=True)
        return p


@lru_cache()
def get_settings() -> Settings:
    return Settings()
