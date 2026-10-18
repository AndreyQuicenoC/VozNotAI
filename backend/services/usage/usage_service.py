from decimal import Decimal
from typing import List
from sqlalchemy.orm import Session
from backend.models.user import User
from backend.repositories.usage_repository import UsageRepository
from backend.schemas.usage import UsageEventResponse, UsageSummaryResponse


class UsageService:
    def __init__(self, db: Session):
        self.db = db
        self.usage_repo = UsageRepository(db)

    def get_summary(self, user: User) -> UsageSummaryResponse:
        summary_raw = self.usage_repo.get_user_summary(user.id)
        events = self.usage_repo.list_by_owner(user.id, limit=20)

        # Quota usage
        quota = user.max_minutes_quota
        minutes = summary_raw["total_audio_minutes"]
        quota_pct = round((minutes / quota * 100.0), 1) if quota > 0 else 0.0

        # Cost status label
        has_actual = summary_raw["actual_cost_usd"] is not None
        has_est = summary_raw["estimated_cost_usd"] > Decimal("0.0000")
        if has_actual and has_est:
            cost_label = "Mixto (Local Estimado + API Reportado)"
        elif has_actual:
            cost_label = "Real reportado"
        elif has_est:
            cost_label = "Estimado (Tarifa de Referencia)"
        else:
            cost_label = "Sin consumo registrado"

        return UsageSummaryResponse(
            total_audio_seconds=summary_raw["total_audio_seconds"],
            total_audio_minutes=summary_raw["total_audio_minutes"],
            total_requests=summary_raw["total_requests"],
            estimated_cost_usd=summary_raw["estimated_cost_usd"],
            actual_cost_usd=summary_raw["actual_cost_usd"],
            cost_status_label=cost_label,
            local_audio_minutes=summary_raw["local_audio_minutes"],
            api_audio_minutes=summary_raw["api_audio_minutes"],
            quota_minutes_assigned=quota,
            quota_percent_used=min(quota_pct, 100.0) if quota > 0 else 0.0,
            recent_events=[UsageEventResponse.model_validate(e) for e in events],
        )

    def list_events(self, user: User, limit: int = 50) -> List[UsageEventResponse]:
        events = self.usage_repo.list_by_owner(user.id, limit=limit)
        return [UsageEventResponse.model_validate(e) for e in events]
