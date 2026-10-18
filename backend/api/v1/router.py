from fastapi import APIRouter
from backend.api.v1.admin import router as admin_router
from backend.api.v1.auth import router as auth_router
from backend.api.v1.conversations import router as conversations_router
from backend.api.v1.notes import router as notes_router
from backend.api.v1.settings import router as settings_router
from backend.api.v1.system import router as system_router
from backend.api.v1.transcriptions import router as transcriptions_router
from backend.api.v1.usage import router as usage_router

api_v1_router = APIRouter(prefix="/v1")

api_v1_router.include_router(auth_router)
api_v1_router.include_router(conversations_router)
api_v1_router.include_router(transcriptions_router)
api_v1_router.include_router(notes_router)
api_v1_router.include_router(usage_router)
api_v1_router.include_router(settings_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(system_router)
