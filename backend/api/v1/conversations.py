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


def _conversation_payload(conversation) -> ConversationResponse:
    latest_audio = conversation.audio_assets[-1] if conversation.audio_assets else None
    return ConversationResponse(
        id=conversation.id,
        owner_user_id=conversation.owner_user_id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages_count=len(conversation.messages),
        audio_assets_count=len(conversation.audio_assets),
        notes_count=len(conversation.notes),
        file_size_bytes=latest_audio.file_size_bytes if latest_audio else 0,
        tags=conversation.tags or "",
    )


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
    return [_conversation_payload(conversation) for conversation in convs]


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    req: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConversationService(db)
    conv = service.create(user_id=current_user.id, title=req.title or "Nueva Conversación")
    return _conversation_payload(conv)


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
    conv = service.update_conversation(
        user_id=current_user.id,
        conversation_id=id,
        new_title=req.title,
        tags=req.tags,
    )
    return _conversation_payload(conv)


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
