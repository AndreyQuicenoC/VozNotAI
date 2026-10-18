from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from backend.api.deps import get_current_user
from backend.db.session import get_db
from backend.models.user import User
from backend.schemas.conversation import (
    ConversationCreate,
    ConversationDetailResponse,
    ConversationResponse,
    ConversationUpdate,
    MessageCreate,
    MessageResponse,
)
from backend.services.conversations.conversation_service import ConversationService

router = APIRouter(prefix="/conversations", tags=["Conversaciones"])


@router.get("", response_model=List[ConversationResponse])
def list_conversations(
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConversationService(db)
    convs = service.list(user_id=current_user.id, search=search, skip=skip, limit=limit)
    res = []
    for c in convs:
        res.append(
            ConversationResponse(
                id=c.id,
                owner_user_id=c.owner_user_id,
                title=c.title,
                created_at=c.created_at,
                updated_at=c.updated_at,
                messages_count=len(c.messages),
                audio_assets_count=len(c.audio_assets),
                notes_count=len(c.notes),
            )
        )
    return res


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    req: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConversationService(db)
    conv = service.create(user_id=current_user.id, title=req.title or "Nueva Conversación")
    return ConversationResponse(
        id=conv.id,
        owner_user_id=conv.owner_user_id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages_count=0,
        audio_assets_count=0,
        notes_count=0,
    )


@router.get("/{id}", response_model=ConversationDetailResponse)
def get_conversation_detail(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConversationService(db)
    conv = service.get(user_id=current_user.id, conversation_id=id)
    return ConversationDetailResponse(
        id=conv.id,
        owner_user_id=conv.owner_user_id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[MessageResponse.model_validate(m) for m in conv.messages],
        audio_assets=conv.audio_assets,
    )


@router.put("/{id}", response_model=ConversationResponse)
def update_conversation(
    id: str,
    req: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConversationService(db)
    conv = service.update_title(user_id=current_user.id, conversation_id=id, new_title=req.title)
    return ConversationResponse(
        id=conv.id,
        owner_user_id=conv.owner_user_id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages_count=len(conv.messages),
        audio_assets_count=len(conv.audio_assets),
        notes_count=len(conv.notes),
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConversationService(db)
    service.delete(user_id=current_user.id, conversation_id=id)
    return None


@router.post("/{id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def post_message(
    id: str,
    req: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConversationService(db)
    msg = service.send_message(user_id=current_user.id, conversation_id=id, content=req.content)
    return MessageResponse.model_validate(msg)
