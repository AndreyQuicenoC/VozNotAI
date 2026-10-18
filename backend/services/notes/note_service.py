from typing import List, Optional
from sqlalchemy.orm import Session
from backend.core.exceptions import ResourceNotFoundException
from backend.models.note import Note
from backend.repositories.note_repository import NoteRepository
from backend.schemas.note import NoteCreate, NoteUpdate


class NoteService:
    def __init__(self, db: Session):
        self.db = db
        self.note_repo = NoteRepository(db)

    def create(self, user_id: str, data: NoteCreate) -> Note:
        note = Note(
            owner_user_id=user_id,
            conversation_id=data.conversation_id,
            transcription_id=data.transcription_id,
            segment_start=data.segment_start,
            segment_end=data.segment_end,
            title=data.title.strip(),
            content=data.content.strip(),
            category=data.category.strip() if data.category else "Idea Clave",
            tags=data.tags.strip() if data.tags else None,
        )
        return self.note_repo.create(note)

    def list(
        self,
        user_id: str,
        conversation_id: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Note]:
        return self.note_repo.list_by_owner(
            owner_user_id=user_id,
            conversation_id=conversation_id,
            category=category,
            search=search,
            skip=skip,
            limit=limit,
        )

    def get(self, user_id: str, note_id: str) -> Note:
        note = self.note_repo.get_by_id_and_owner(note_id, user_id)
        if not note:
            raise ResourceNotFoundException("Nota", note_id)
        return note

    def update(self, user_id: str, note_id: str, data: NoteUpdate) -> Note:
        note = self.get(user_id, note_id)
        if data.title is not None:
            note.title = data.title.strip()
        if data.content is not None:
            note.content = data.content.strip()
        if data.category is not None:
            note.category = data.category.strip()
        if data.tags is not None:
            note.tags = data.tags.strip()

        self.db.commit()
        self.db.refresh(note)
        return note

    def delete(self, user_id: str, note_id: str) -> None:
        note = self.get(user_id, note_id)
        self.note_repo.delete(note)
