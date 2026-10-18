from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from backend.core.config import get_settings
from backend.core.exceptions import (
    AuthenticationException,
    BusinessRuleViolationException,
    PermissionDeniedException,
    ResourceNotFoundException,
)
from backend.core.security import (
    compare_token_hashes,
    generate_secure_token,
    get_password_hash,
    hash_token,
    verify_password,
)
from backend.models.password_reset import PasswordResetToken
from backend.models.user import User
from backend.repositories.user_repository import UserRepository
from backend.schemas.auth import (
    PasswordChangeRequest,
    PasswordResetConfirm,
    UserProfileUpdate,
    UserRegisterRequest,
)

settings = get_settings()


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def register(self, req: UserRegisterRequest) -> User:
        existing = self.user_repo.get_by_email(req.email)
        if existing:
            raise BusinessRuleViolationException("El correo electrónico ya se encuentra registrado", code="EMAIL_ALREADY_EXISTS")

        pw_hash = get_password_hash(req.password)
        new_user = User(
            first_name=req.first_name.strip(),
            last_name=req.last_name.strip(),
            email=req.email.lower().strip(),
            phone=req.phone.strip() if req.phone else None,
            birth_date=req.birth_date,
            password_hash=pw_hash,
            role="customer",  # Explicitly prevent public registration of admin roles
            role_title="Cliente Pro",
            organization="Eureka Client",
            avatar_url=None,
            preferred_language="auto",
            is_active=True,
            is_verified=True,
            max_minutes_quota=120,
            preferred_mode="Local (CUDA)",
        )
        return self.user_repo.create(new_user)

    def login(self, email: str, password: str, client_ip: Optional[str] = None) -> User:
        user = self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise AuthenticationException("Credenciales inválidas")

        if not user.is_active:
            raise PermissionDeniedException("La cuenta de usuario se encuentra suspendida o inactiva")

        user.last_login_at = datetime.now(timezone.utc)
        self.db.commit()
        return user

    def request_password_reset(self, email: str) -> Optional[str]:
        """Generates a secure password reset token. Returns token for dev/testing logs, but API returns generic status."""
        user = self.user_repo.get_by_email(email)
        if not user:
            # Prevent account enumeration
            return None

        raw_token = generate_secure_token(32)
        token_digest = hash_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.RESET_TOKEN_TTL_MINUTES)

        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=token_digest,
            expires_at=expires_at,
        )
        self.db.add(reset_record)
        self.db.commit()
        return raw_token

    def confirm_password_reset(self, req: PasswordResetConfirm) -> None:
        token_digest = hash_token(req.token)
        record = (
            self.db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.token_hash == token_digest,
                PasswordResetToken.used_at.is_(None),
            )
            .first()
        )

        expires = record.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)

        if expires < datetime.now(timezone.utc):
            raise BusinessRuleViolationException(
                "El token de recuperación es inválido o ha expirado",
                code="INVALID_RESET_TOKEN",
            )

        user = self.user_repo.get_by_id(record.user_id)
        if not user:
            raise ResourceNotFoundException("Usuario no encontrado")

        user.password_hash = get_password_hash(req.new_password)
        record.used_at = datetime.now(timezone.utc)
        self.db.commit()

    def change_password(self, user: User, req: PasswordChangeRequest) -> None:
        if not verify_password(req.current_password, user.password_hash):
            raise AuthenticationException("La contraseña actual es incorrecta")

        user.password_hash = get_password_hash(req.new_password)
        self.db.commit()

    def update_profile(self, user: User, req: UserProfileUpdate) -> User:
        if req.first_name is not None:
            user.first_name = req.first_name.strip()
        if req.last_name is not None:
            user.last_name = req.last_name.strip()
        if req.phone is not None:
            user.phone = req.phone.strip() if req.phone else None
        if req.birth_date is not None:
            user.birth_date = req.birth_date
        if req.avatar_url is not None:
            avatar = req.avatar_url.strip()
            if avatar and not avatar.startswith("data:image/"):
                raise BusinessRuleViolationException(
                    "La foto de perfil debe ser una imagen cargada desde el equipo.",
                    code="INVALID_AVATAR",
                )
            user.avatar_url = avatar or None
        if req.preferred_mode is not None:
            user.preferred_mode = req.preferred_mode
        if req.preferred_language is not None:
            user.preferred_language = req.preferred_language

        self.db.commit()
        self.db.refresh(user)
        return user
