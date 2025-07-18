from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

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
    """ Start a new conversation and lock in chosen languages. """
    # 1) create and commit
    conv = Conversation(
        user_id=user.id,
        source_language=payload.source_language,
        target_language=payload.target_language,
    )
    db.add(conv)
    await db.commit()

    # 2) re‐load with messages eagerly loaded (so .messages is an in‐memory list,
    #    not a lazy loader that would attempt async IO later)
    stmt = (
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conv.id)
    )
    result = await db.execute(stmt)
    conv_with_msgs = result.scalar_one()

    return conv_with_msgs


@router.get("", response_model=List[ConversationRead])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(fastapi_users.current_user()),
):
    """ Show the user's past conversations (with their messages). """
    stmt = (
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.user_id == user.id)
        .order_by(Conversation.created_at)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{conversation_id}", response_model=ConversationRead)
async def get_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(fastapi_users.current_user()),
):
    """ Fetch one conversation (including its history). """
    stmt = (
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id)
        .where(Conversation.user_id == user.id)
    )
    result = await db.execute(stmt)
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Not found")
    return conv


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(fastapi_users.current_user()),
):
    """ Delete a conversation on request of the user. """
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.user_id != user.id:
        raise HTTPException(status_code=404, detail="Not Found")
    await db.delete(conv)
    await db.commit()
    return {"detail": "deleted"}
