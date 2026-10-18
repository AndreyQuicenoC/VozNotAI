from typing import List, Optional
from sqlalchemy import or_
from sqlalchemy.orm import Session
from backend.models.conversation import Conversation
from backend.models.message import Message
from backend.repositories.base import BaseRepository


class ConversationRepository(BaseRepository[Conversation]):
    def __init__(self, db: Session):
        super().__init__(Conversation, db)

    def get_by_id_and_owner(self, conversation_id: str, owner_user_id: str) -> Optional[Conversation]:
        return (
            self.db.query(Conversation)
            .filter(Conversation.id == conversation_id, Conversation.owner_user_id == owner_user_id)
            .first()
        )

    def list_by_owner(
        self,
        owner_user_id: str,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Conversation]:
        query = self.db.query(Conversation).filter(
            Conversation.owner_user_id == owner_user_id,
            Conversation.archived_at.is_(None),
        )
        if search:
            query = query.filter(Conversation.title.ilike(f"%{search.strip()}%"))
        return query.order_by(Conversation.updated_at.desc()).offset(skip).limit(limit).all()

    def add_message(
        self,
        conversation_id: str,
        owner_user_id: str,
        role: str,
        content: str,
        message_type: str = "text",
        transcription_id: Optional[str] = None,
        metadata_json: Optional[dict] = None,
    ) -> Message:
        msg = Message(
            conversation_id=conversation_id,
            owner_user_id=owner_user_id,
            role=role,
            content=content,
            message_type=message_type,
            transcription_id=transcription_id,
            metadata_json=metadata_json,
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg
