from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..db import AsyncSessionLocal
from ..models import Conversation
from ..schemas import ConversationCreate, ConversationRead
from ..users import fastapi_users, UserRead

router = APIRouter(prefix="/conversations", tags=["conversations"])


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.post("", response_model=ConversationRead)
async def create_conversation(
    payload: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(fastapi_users.current_user()),
):
    """ Start a new conversation and lock in chosen languages."""
    conv = Conversation(
        user_id=user.id,
        source_language=payload.source_language,
        target_language=payload.target_language
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.get("", response_model=List[ConversationRead])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(fastapi_users.current_user()),
):
    """ Show the user's past conversations. """
    q = await db.execute(
        select(Conversation).where(Conversation.user_id == user.id)
    )
    return q.scalars().all()


@router.get("/{conversation_id}", response_model=ConversationRead)
async def get_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(fastapi_users.current_user())
):
    """ Fetch one conversation (including its history)."""
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.user_id != user.id:
        raise HTTPException(404, "Not found")
    return conv


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(fastapi_users.current_user())
):
    """ Delete a conversation on request of the user. """
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.user_id != user.id: 
        raise HTTPException(404, "Not Found")
    await db.delete(conv)
    await db.commit()
    return {"detail": "deleted"}
