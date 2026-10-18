from typing import List, Optional
from sqlalchemy import or_
from sqlalchemy.orm import Session
from backend.models.note import Note
from backend.repositories.base import BaseRepository


class NoteRepository(BaseRepository[Note]):
    def __init__(self, db: Session):
        super().__init__(Note, db)

    def get_by_id_and_owner(self, note_id: str, owner_user_id: str) -> Optional[Note]:
        return (
            self.db.query(Note)
            .filter(Note.id == note_id, Note.owner_user_id == owner_user_id)
            .first()
        )

    def list_by_owner(
        self,
        owner_user_id: str,
        conversation_id: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Note]:
        query = self.db.query(Note).filter(Note.owner_user_id == owner_user_id)

        if conversation_id:
            query = query.filter(Note.conversation_id == conversation_id)

        if category:
            query = query.filter(Note.category == category)

        if search:
            s = f"%{search.strip()}%"
            query = query.filter(or_(Note.title.ilike(s), Note.content.ilike(s), Note.tags.ilike(s)))

        return query.order_by(Note.created_at.desc()).offset(skip).limit(limit).all()
