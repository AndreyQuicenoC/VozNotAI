from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.core.exceptions import ResourceNotFoundException
from backend.models import AuditEvent, SystemSettings, Transcription, User
from backend.repositories.audit_repository import AuditRepository
from backend.repositories.settings_repository import SettingsRepository
from backend.repositories.transcription_repository import TranscriptionRepository
from backend.repositories.usage_repository import UsageRepository
from backend.repositories.user_repository import UserRepository
from backend.schemas.admin import AdminDashboardMetrics, AdminUserUpdate, AuditEventResponse
from backend.schemas.auth import UserResponse
from backend.schemas.settings import SystemSettingsResponse, SystemSettingsUpdate
from backend.services.ai.local_whisper_provider import LocalWhisperProvider


class AdminService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.transcription_repo = TranscriptionRepository(db)
        self.usage_repo = UsageRepository(db)
        self.settings_repo = SettingsRepository(db)
        self.audit_repo = AuditRepository(db)

    def get_dashboard_metrics(self) -> AdminDashboardMetrics:
        all_users = self.db.query(User).filter(User.deleted_at.is_(None)).all()
        total_users = len(all_users)
        active_users = len([u for u in all_users if u.is_active])

        all_transcriptions = self.db.query(Transcription).all()
        total_trans = len(all_transcriptions)
        completed_trans = len([t for t in all_transcriptions if t.status == "completed"])
        failed_trans = len([t for t in all_transcriptions if t.status == "failed"])

        global_usage = self.usage_repo.get_global_metrics()
        sys_settings = self.settings_repo.get_active_settings()

        # Check local whisper health
        local_provider = LocalWhisperProvider(model_name=sys_settings.local_model_name)
        whisper_status = local_provider.check_availability()

        active_model = sys_settings.local_model_name if sys_settings.execution_mode == "local" else sys_settings.remote_model_name

        return AdminDashboardMetrics(
            total_users=total_users,
            active_users=active_users,
            new_users_period=total_users,
            total_transcriptions=total_trans,
            completed_transcriptions=completed_trans,
            failed_transcriptions=failed_trans,
            total_minutes_processed=global_usage["total_minutes"],
            local_minutes_processed=global_usage["local_minutes"],
            api_minutes_processed=global_usage["api_minutes"],
            estimated_cost_total=global_usage["estimated_cost_total"],
            actual_cost_total=global_usage["actual_cost_total"],
            whisper_local_available=whisper_status.available,
            current_execution_mode=sys_settings.execution_mode,
            active_model=active_model,
        )

    def list_users(
        self,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[UserResponse], int]:
        users, total = self.user_repo.list_filtered(
            search=search,
            role=role,
            is_active=is_active,
            skip=skip,
            limit=limit,
        )
        return [UserResponse.model_validate(u) for u in users], total

    def update_user(self, admin_user: User, target_user_id: str, data: AdminUserUpdate) -> UserResponse:
        user = self.user_repo.get_active_by_id(target_user_id)
        if not user:
            raise ResourceNotFoundException("Usuario", target_user_id)

        changes = []
        if data.is_active is not None and data.is_active != user.is_active:
            user.is_active = data.is_active
            changes.append(f"is_active={data.is_active}")

        if data.role is not None and data.role != user.role:
            user.role = data.role
            changes.append(f"role={data.role}")

        if data.role_title is not None:
            user.role_title = data.role_title.strip()

        if data.organization is not None:
            user.organization = data.organization.strip()

        if data.max_minutes_quota is not None:
            user.max_minutes_quota = data.max_minutes_quota
            changes.append(f"quota={data.max_minutes_quota}")

        if data.preferred_mode is not None:
            user.preferred_mode = data.preferred_mode.strip()

        self.db.commit()
        self.db.refresh(user)

        if changes:
            self.audit_repo.log(
                event_type="USER_MODIFIED",
                description=f"Admin '{admin_user.email}' modificó al usuario '{user.email}': {', '.join(changes)}",
                user_identifier=admin_user.email,
                resource_id=user.id,
                severity="warn" if not user.is_active else "info",
            )

        return UserResponse.model_validate(user)

    def get_settings(self) -> SystemSettingsResponse:
        settings_model = self.settings_repo.get_active_settings()
        return SystemSettingsResponse.model_validate(settings_model)

    def update_settings(self, admin_user: User, data: SystemSettingsUpdate) -> SystemSettingsResponse:
        sys_settings = self.settings_repo.get_active_settings()
        changes = []

        if data.execution_mode is not None:
            sys_settings.execution_mode = data.execution_mode
            changes.append(f"mode={data.execution_mode}")

        if data.local_model_name is not None:
            sys_settings.local_model_name = data.local_model_name
            changes.append(f"local_model={data.local_model_name}")

        if data.remote_provider_enabled is not None:
            sys_settings.remote_provider_enabled = data.remote_provider_enabled
            changes.append(f"remote_enabled={data.remote_provider_enabled}")

        if data.remote_provider_name is not None:
            sys_settings.remote_provider_name = data.remote_provider_name.strip()

        if data.remote_endpoint is not None:
            sys_settings.remote_endpoint = data.remote_endpoint.strip()
            changes.append("remote_endpoint_updated")

        if data.remote_model_name is not None:
            sys_settings.remote_model_name = data.remote_model_name.strip()

        if data.remote_api_key is not None and data.remote_api_key.strip():
            key_raw = data.remote_api_key.strip()
            # Mask secret key in database representation
            sys_settings.remote_api_key_masked = f"{key_raw[:7]}...{key_raw[-4:]}" if len(key_raw) > 12 else "sk-****"
            changes.append("remote_api_key_updated")

        if data.usage_rate_per_audio_minute is not None:
            sys_settings.usage_rate_per_audio_minute = data.usage_rate_per_audio_minute
            changes.append(f"rate_per_min={data.usage_rate_per_audio_minute}")

        if data.maximum_audio_duration_seconds is not None:
            sys_settings.maximum_audio_duration_seconds = data.maximum_audio_duration_seconds
            changes.append(f"max_duration={data.maximum_audio_duration_seconds}s")

        if data.maximum_upload_size_bytes is not None:
            sys_settings.maximum_upload_size_bytes = data.maximum_upload_size_bytes

        sys_settings.updated_by = admin_user.email
        self.db.commit()
        self.db.refresh(sys_settings)

        # Audit log (without logging the secret key!)
        self.audit_repo.log(
            event_type="CONFIG_UPDATE",
            description=f"Admin '{admin_user.email}' actualizó configuración de IA: {', '.join(changes)}",
            user_identifier=admin_user.email,
            severity="info",
        )

        return SystemSettingsResponse.model_validate(sys_settings)

    def list_audit_events(self, limit: int = 50, skip: int = 0) -> List[AuditEventResponse]:
        events = self.audit_repo.list_events(limit=limit, skip=skip)
        return [AuditEventResponse.model_validate(e) for e in events]
