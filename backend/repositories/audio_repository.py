from typing import Optional
from sqlalchemy.orm import Session
from backend.models.audio_asset import AudioAsset
from backend.repositories.base import BaseRepository


class AudioRepository(BaseRepository[AudioAsset]):
    def __init__(self, db: Session):
        super().__init__(AudioAsset, db)

    def get_by_id_and_owner(self, audio_id: str, owner_user_id: str) -> Optional[AudioAsset]:
        return (
            self.db.query(AudioAsset)
            .filter(AudioAsset.id == audio_id, AudioAsset.owner_user_id == owner_user_id)
            .first()
        )

    def get_by_storage_key(self, storage_key: str) -> Optional[AudioAsset]:
        return self.db.query(AudioAsset).filter(AudioAsset.storage_key == storage_key).first()
