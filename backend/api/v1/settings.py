from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.api.deps import get_current_admin_user, get_current_user
from backend.db.session import get_db
from backend.models.user import User
from backend.schemas.settings import SystemSettingsResponse, SystemSettingsUpdate
from backend.services.admin.admin_service import AdminService

router = APIRouter(prefix="/settings", tags=["Ajustes del Sistema"])


@router.get("", response_model=SystemSettingsResponse)
def get_system_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdminService(db)
    return service.get_settings()


@router.put("", response_model=SystemSettingsResponse)
def update_system_settings(
    req: SystemSettingsUpdate,
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    service = AdminService(db)
    return service.update_settings(admin_user=admin_user, data=req)
