from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.api.deps import get_current_user
from backend.db.session import get_db
from backend.models.user import User
from backend.schemas.usage import UsageEventResponse, UsageSummaryResponse
from backend.services.usage.usage_service import UsageService

router = APIRouter(prefix="/usage", tags=["Consumo y Costos"])


@router.get("/summary", response_model=UsageSummaryResponse)
def get_usage_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = UsageService(db)
    return service.get_summary(current_user)


@router.get("/events", response_model=List[UsageEventResponse])
def list_usage_events(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = UsageService(db)
    return service.list_events(current_user, limit=limit)
