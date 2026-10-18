from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from backend.api.deps import get_current_user
from backend.db.session import get_db
from backend.models.user import User
from backend.schemas.note import NoteCreate, NoteResponse, NoteUpdate
from backend.services.notes.note_service import NoteService

router = APIRouter(prefix="/notes", tags=["Notas Inteligentes"])


@router.get("", response_model=List[NoteResponse])
def list_notes(
    conversation_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = NoteService(db)
    notes = service.list(
        user_id=current_user.id,
        conversation_id=conversation_id,
        category=category,
        search=search,
        skip=skip,
        limit=limit,
    )
    return [NoteResponse.model_validate(n) for n in notes]


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    req: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = NoteService(db)
    note = service.create(user_id=current_user.id, data=req)
    return NoteResponse.model_validate(note)


@router.get("/{id}", response_model=NoteResponse)
def get_note(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = NoteService(db)
    note = service.get(user_id=current_user.id, note_id=id)
    return NoteResponse.model_validate(note)


@router.put("/{id}", response_model=NoteResponse)
def update_note(
    id: str,
    req: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = NoteService(db)
    note = service.update(user_id=current_user.id, note_id=id, data=req)
    return NoteResponse.model_validate(note)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = NoteService(db)
    service.delete(user_id=current_user.id, note_id=id)
    return None
