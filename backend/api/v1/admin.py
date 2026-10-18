from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.api.deps import get_current_admin_user
from backend.db.session import get_db
from backend.models.user import User
from backend.schemas.admin import AdminDashboardMetrics, AdminUserUpdate, AuditEventResponse
from backend.schemas.auth import UserResponse
from backend.services.admin.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["Administración"])


@router.get("/dashboard", response_model=AdminDashboardMetrics)
def get_admin_dashboard(
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    service = AdminService(db)
    return service.get_dashboard_metrics()


@router.get("/users")
def list_admin_users(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    service = AdminService(db)
    users, total = service.list_users(
        search=search,
        role=role,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )
    return {
        "users": users,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.put("/users/{id}", response_model=UserResponse)
def update_user_status_and_role(
    id: str,
    req: AdminUserUpdate,
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    service = AdminService(db)
    return service.update_user(admin_user=admin_user, target_user_id=id, data=req)


@router.get("/audit", response_model=List[AuditEventResponse])
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    service = AdminService(db)
    return service.list_audit_events(limit=limit, skip=skip)
