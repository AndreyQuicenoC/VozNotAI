from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel


class UsageEventResponse(BaseModel):
    id: str
    conversation_id: Optional[str] = None
    transcription_id: Optional[str] = None
    provider: str
    model_name: str
    execution_mode: str
    audio_duration_seconds: float
    processing_duration_ms: int
    estimated_cost_usd: Decimal
    actual_cost_usd: Optional[Decimal] = None
    cost_source: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class UsageSummaryResponse(BaseModel):
    total_audio_seconds: float
    total_audio_minutes: float
    total_requests: int
    estimated_cost_usd: Decimal
    actual_cost_usd: Optional[Decimal] = None
    cost_status_label: str  # "Estimado", "Real reportado", "Mixto"
    local_audio_minutes: float
    api_audio_minutes: float
    quota_minutes_assigned: int
    quota_percent_used: float
    recent_events: List[UsageEventResponse] = []
