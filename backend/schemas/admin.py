from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from backend.schemas.auth import UserResponse
from backend.schemas.usage import UsageEventResponse


class AdminDashboardMetrics(BaseModel):
    total_users: int
    active_users: int
    new_users_period: int
    total_transcriptions: int
    completed_transcriptions: int
    failed_transcriptions: int
    total_minutes_processed: float
    local_minutes_processed: float
    api_minutes_processed: float
    estimated_cost_total: Decimal
    actual_cost_total: Decimal
    whisper_local_available: bool
    current_execution_mode: str
    active_model: str


class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = Field(None, pattern="^(customer|admin|auditor)$")
    role_title: Optional[str] = None
    organization: Optional[str] = None
    max_minutes_quota: Optional[int] = Field(None, ge=0)
    preferred_mode: Optional[str] = None


class AuditEventResponse(BaseModel):
    id: str
    event_type: str
    description: str
    user_identifier: str
    client_ip: Optional[str] = None
    resource_id: Optional[str] = None
    severity: str
    created_at: datetime

    class Config:
        from_attributes = True
