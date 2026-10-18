from typing import Optional
from fastapi import Cookie, Depends, Header, status
from sqlalchemy.orm import Session
from backend.core.exceptions import AuthenticationException, PermissionDeniedException
from backend.core.security import decode_access_token
from backend.db.session import get_db
from backend.models.user import User
from backend.repositories.user_repository import UserRepository


def get_current_user(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
    access_token: Optional[str] = Cookie(None),
) -> User:
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ")[1]
    elif access_token:
        token = access_token

    if not token:
        raise AuthenticationException("No se proporcionó token de autenticación")

    payload = decode_access_token(token)
    if not payload:
        raise AuthenticationException("El token de sesión ha expirado o es inválido")

    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationException("Token no contiene identificador de usuario")

    repo = UserRepository(db)
    user = repo.get_active_by_id(user_id)
    if not user:
        raise AuthenticationException("Usuario no encontrado o dado de baja")

    if not user.is_active:
        raise PermissionDeniedException("Cuenta de usuario inactiva o suspendida")

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise PermissionDeniedException("Operación restringida exclusivamente a Administradores del sistema")
    return current_user
