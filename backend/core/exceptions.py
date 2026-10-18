from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class DomainException(Exception):
    """Base domain exception."""
    def __init__(self, message: str, code: str = "DOMAIN_ERROR", details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}


class AuthenticationException(HTTPException):
    def __init__(self, detail: str = "Credenciales incorrectas o sesión expirada"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTHENTICATION_FAILED", "message": detail},
            headers={"WWW-Authenticate": "Bearer"},
        )


class PermissionDeniedException(HTTPException):
    def __init__(self, detail: str = "Acceso denegado al recurso solicitado"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "PERMISSION_DENIED", "message": detail},
        )


class ResourceNotFoundException(HTTPException):
    def __init__(self, resource: str = "Recurso", identifier: Optional[str] = None):
        msg = f"{resource} no encontrado" if not identifier else f"{resource} con identificador '{identifier}' no fue encontrado"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": msg},
        )


class BusinessRuleViolationException(HTTPException):
    def __init__(self, detail: str, code: str = "BUSINESS_RULE_VIOLATION"):
        self.code = code
        self.message = detail
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": code, "message": detail},
        )


class TranscriptionProviderException(HTTPException):
    def __init__(self, detail: str, provider: str, code: str = "TRANSCRIPTION_ERROR"):
        self.code = code
        self.message = detail
        self.provider = provider
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": code, "message": detail, "provider": provider},
        )


class SSRFDetectedException(HTTPException):
    def __init__(self, detail: str = "Destino de red restringido por políticas de seguridad SSRF"):
        self.code = "SSRF_SECURITY_VIOLATION"
        self.message = detail
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "SSRF_SECURITY_VIOLATION", "message": detail},
        )
