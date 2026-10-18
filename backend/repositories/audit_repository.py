from typing import List, Optional
from sqlalchemy.orm import Session
from backend.models.audit_event import AuditEvent
from backend.repositories.base import BaseRepository


class AuditRepository(BaseRepository[AuditEvent]):
    def __init__(self, db: Session):
        super().__init__(AuditEvent, db)

    def log(
        self,
        event_type: str,
        description: str,
        user_identifier: str = "system",
        client_ip: Optional[str] = None,
        resource_id: Optional[str] = None,
        severity: str = "info",
    ) -> AuditEvent:
        event = AuditEvent(
            event_type=event_type,
            description=description,
            user_identifier=user_identifier,
            client_ip=client_ip,
            resource_id=resource_id,
            severity=severity,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def list_events(self, limit: int = 50, skip: int = 0) -> List[AuditEvent]:
        return (
            self.db.query(AuditEvent)
            .order_by(AuditEvent.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
