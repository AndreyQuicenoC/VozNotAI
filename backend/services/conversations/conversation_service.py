import os
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.core.config import get_settings
from backend.core.exceptions import ResourceNotFoundException
from backend.models import Conversation, Message
from backend.repositories.conversation_repository import ConversationRepository

settings = get_settings()


class ConversationService:
    def __init__(self, db: Session):
        self.db = db
        self.conv_repo = ConversationRepository(db)

    def create(self, user_id: str, title: str = "Nueva Conversación") -> Conversation:
        conv = Conversation(
            owner_user_id=user_id,
            title=title.strip() or "Nueva Conversación",
        )
        return self.conv_repo.create(conv)

    def list(self, user_id: str, search: Optional[str] = None, skip: int = 0, limit: int = 50) -> List[Conversation]:
        return self.conv_repo.list_by_owner(user_id, search=search, skip=skip, limit=limit)

    def get(self, user_id: str, conversation_id: str) -> Conversation:
        conv = self.conv_repo.get_by_id_and_owner(conversation_id, user_id)
        if not conv:
            raise ResourceNotFoundException("Conversación", conversation_id)
        return conv

    def update_title(self, user_id: str, conversation_id: str, new_title: str) -> Conversation:
        conv = self.get(user_id, conversation_id)
        conv.title = new_title.strip()
        self.db.commit()
        self.db.refresh(conv)
        return conv

    def delete(self, user_id: str, conversation_id: str) -> None:
        conv = self.get(user_id, conversation_id)

        # Cleanup physical audio files associated with this conversation
        for audio in conv.audio_assets:
            if audio.storage_key:
                file_path = settings.upload_path / audio.storage_key
                if file_path.exists():
                    try:
                        os.remove(file_path)
                    except Exception:
                        pass

        self.conv_repo.delete(conv)

    def send_message(self, user_id: str, conversation_id: str, content: str) -> Message:
        conv = self.get(user_id, conversation_id)
        return self.conv_repo.add_message(
            conversation_id=conv.id,
            owner_user_id=user_id,
            role="user",
            content=content.strip(),
            message_type="text",
        )
