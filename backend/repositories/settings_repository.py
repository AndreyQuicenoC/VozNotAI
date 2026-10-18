from typing import Optional
from sqlalchemy.orm import Session
from backend.models.system_settings import SystemSettings
from backend.repositories.base import BaseRepository


class SettingsRepository(BaseRepository[SystemSettings]):
    def __init__(self, db: Session):
        super().__init__(SystemSettings, db)

    def get_active_settings(self) -> SystemSettings:
        settings = self.db.query(SystemSettings).first()
        if not settings:
            settings = SystemSettings()
            self.db.add(settings)
            self.db.commit()
            self.db.refresh(settings)
        return settings
