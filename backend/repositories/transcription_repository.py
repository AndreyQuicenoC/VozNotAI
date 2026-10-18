from typing import List, Optional
from sqlalchemy.orm import Session
from backend.models.transcription import Transcription
from backend.repositories.base import BaseRepository


class TranscriptionRepository(BaseRepository[Transcription]):
    def __init__(self, db: Session):
        super().__init__(Transcription, db)

    def get_by_id_and_owner(self, transcription_id: str, owner_user_id: str) -> Optional[Transcription]:
        return (
            self.db.query(Transcription)
            .filter(Transcription.id == transcription_id, Transcription.owner_user_id == owner_user_id)
            .first()
        )

    def list_by_conversation(self, conversation_id: str, owner_user_id: str) -> List[Transcription]:
        return (
            self.db.query(Transcription)
            .filter(
                Transcription.conversation_id == conversation_id,
                Transcription.owner_user_id == owner_user_id,
            )
            .order_by(Transcription.created_at.desc())
            .all()
        )

    def list_by_owner(self, owner_user_id: str, limit: int = 50) -> List[Transcription]:
        return (
            self.db.query(Transcription)
            .filter(Transcription.owner_user_id == owner_user_id)
            .order_by(Transcription.created_at.desc())
            .limit(limit)
            .all()
        )
