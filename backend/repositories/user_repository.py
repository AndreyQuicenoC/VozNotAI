from typing import List, Optional, Tuple
from sqlalchemy import or_
from sqlalchemy.orm import Session
from backend.models.user import User
from backend.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> Optional[User]:
        normalized = email.lower().strip()
        return self.db.query(User).filter(User.email == normalized, User.deleted_at.is_(None)).first()

    def get_active_by_id(self, user_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()

    def list_filtered(
        self,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[User], int]:
        query = self.db.query(User).filter(User.deleted_at.is_(None))

        if search:
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(s),
                    User.last_name.ilike(s),
                    User.email.ilike(s),
                    User.organization.ilike(s),
                )
            )

        if role:
            query = query.filter(User.role == role)

        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        total = query.count()
        users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
        return users, total
