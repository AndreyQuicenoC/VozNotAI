from decimal import Decimal
from typing import Any, Dict, List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from backend.models.usage_event import UsageEvent
from backend.repositories.base import BaseRepository


class UsageRepository(BaseRepository[UsageEvent]):
    def __init__(self, db: Session):
        super().__init__(UsageEvent, db)

    def list_by_owner(self, owner_user_id: str, limit: int = 50) -> List[UsageEvent]:
        return (
            self.db.query(UsageEvent)
            .filter(UsageEvent.owner_user_id == owner_user_id)
            .order_by(UsageEvent.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_user_summary(self, owner_user_id: str) -> Dict[str, Any]:
        events = (
            self.db.query(UsageEvent)
            .filter(UsageEvent.owner_user_id == owner_user_id)
            .all()
        )

        total_seconds = sum(e.audio_duration_seconds for e in events)
        total_requests = len(events)
        total_estimated = sum(e.estimated_cost_usd for e in events) if events else Decimal("0.0000")
        actual_costs = [e.actual_cost_usd for e in events if e.actual_cost_usd is not None]
        total_actual = sum(actual_costs) if actual_costs else None

        local_seconds = sum(e.audio_duration_seconds for e in events if e.execution_mode == "local")
        api_seconds = sum(e.audio_duration_seconds for e in events if e.execution_mode == "api")

        return {
            "total_audio_seconds": round(total_seconds, 2),
            "total_audio_minutes": round(total_seconds / 60.0, 2),
            "total_requests": total_requests,
            "estimated_cost_usd": Decimal(str(round(total_estimated, 4))),
            "actual_cost_usd": Decimal(str(round(total_actual, 4))) if total_actual is not None else None,
            "local_audio_minutes": round(local_seconds / 60.0, 2),
            "api_audio_minutes": round(api_seconds / 60.0, 2),
        }

    def get_global_metrics(self) -> Dict[str, Any]:
        total_events = self.db.query(UsageEvent).all()
        total_seconds = sum(e.audio_duration_seconds for e in total_events)
        local_seconds = sum(e.audio_duration_seconds for e in total_events if e.execution_mode == "local")
        api_seconds = sum(e.audio_duration_seconds for e in total_events if e.execution_mode == "api")

        total_estimated = sum(e.estimated_cost_usd for e in total_events) if total_events else Decimal("0.0000")
        actual_costs = [e.actual_cost_usd for e in total_events if e.actual_cost_usd is not None]
        total_actual = sum(actual_costs) if actual_costs else Decimal("0.0000")

        return {
            "total_minutes": round(total_seconds / 60.0, 2),
            "local_minutes": round(local_seconds / 60.0, 2),
            "api_minutes": round(api_seconds / 60.0, 2),
            "estimated_cost_total": Decimal(str(round(total_estimated, 4))),
            "actual_cost_total": Decimal(str(round(total_actual, 4))),
        }
