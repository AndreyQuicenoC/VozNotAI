from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class SystemSettingsResponse(BaseModel):
    execution_mode: str
    local_model_name: str
    local_model_available: bool
    remote_provider_enabled: bool
    remote_provider_name: str
    remote_endpoint: str
    remote_model_name: str
    remote_api_key_masked: str
    usage_rate_per_audio_minute: Decimal
    maximum_audio_duration_seconds: int
    maximum_upload_size_bytes: int
    per_user_limits: Optional[Dict[str, Any]] = None
    updated_at: datetime
    updated_by: Optional[str] = None

    class Config:
        from_attributes = True


class SystemSettingsUpdate(BaseModel):
    execution_mode: Optional[str] = Field(None, pattern="^(local|api)$")
    local_model_name: Optional[str] = Field(None, pattern="^(base|small)$")
    remote_provider_enabled: Optional[bool] = None
    remote_provider_name: Optional[str] = None
    remote_endpoint: Optional[str] = None
    remote_model_name: Optional[str] = None
    remote_api_key: Optional[str] = None  # Write-only key update; never read back!
    usage_rate_per_audio_minute: Optional[Decimal] = None
    maximum_audio_duration_seconds: Optional[int] = Field(None, ge=10, le=600)
    maximum_upload_size_bytes: Optional[int] = Field(None, ge=1048576, le=104857600)
