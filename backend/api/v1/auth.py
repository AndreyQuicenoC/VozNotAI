from datetime import timedelta
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from backend.api.deps import get_current_user
from backend.core.config import get_settings
from backend.core.security import create_access_token
from backend.db.session import get_db
from backend.models.user import User
from backend.schemas.auth import (
    PasswordChangeRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    TokenResponse,
    UserProfileUpdate,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from backend.services.auth.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Autenticación"])
settings = get_settings()


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    req: UserRegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    user = service.register(req)

    token = create_access_token(
        subject=user.id,
        role=user.role,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    set_auth_cookie(response, token)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(
    req: UserLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    user = service.login(email=req.email, password=req.password)

    token = create_access_token(
        subject=user.id,
        role=user.role,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    set_auth_cookie(response, token)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )
    return {"message": "Sesión cerrada exitosamente"}


@router.get("/me", response_model=UserResponse)
def get_current_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_profile(
    req: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    updated = service.update_profile(current_user, req)
    return UserResponse.model_validate(updated)


@router.post("/change-password")
def change_password(
    req: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    service.change_password(current_user, req)
    return {"message": "Contraseña actualizada exitosamente"}


@router.post("/password-recovery")
def request_password_recovery(
    req: PasswordResetRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    token = service.request_password_reset(req.email)
    # Generic message prevents account enumeration
    res = {"message": "Si la cuenta existe, se ha enviado un enlace de recuperación."}
    if not settings.is_production and token:
        # In local dev environment, surface token for convenient verification
        res["dev_reset_token"] = token
    return res


@router.post("/password-reset")
def confirm_password_reset(
    req: PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    service.confirm_password_reset(req)
    return {"message": "Contraseña restablecida correctamente. Puede iniciar sesión."}
