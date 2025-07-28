# backend/app/routers/conversations.py

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import os
from dotenv import load_dotenv
from openai import OpenAI

from ..db import AsyncSessionLocal
from ..models import Conversation, Message
from ..schemas import ConversationCreate, ConversationRead
from ..users import fastapi_users, UserRead

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
    """ Start a new conversation, optionally seed it with an initial OpenAI response. """
    # 1) create the conversation record
    conv = Conversation(
        user_id=user.id,
        source_language=payload.source_language,
        target_language=payload.target_language,
        prompt=payload.prompt,
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    # 2) if the user supplied a prompt, fire off an assistant reply
    if payload.prompt:
        pieces: List[str] = []
        pieces.append(f"Context: {payload.prompt.strip()}")
        tutor_prompt = f"""
You are a friendly {payload.target_language} tutor.  
The user’s native language is {payload.source_language},  
and they want to practice {payload.target_language}.

**Rules:**
1. Only ever use {payload.target_language} in your conversation—unless you are correcting a mistake.
2. When you correct, **first** present the correction _in {payload.source_language}_, with a heading "Correction",
   then leave a blank line, then continue your reply _in {payload.target_language}_
   with a heading "Conversational response".
3. The correction must **never** be in {payload.target_language}.
4. The correction should explain why the user's attempt was wrong and why the correction is right.
5. Always include exactly one blank line between correction and reply.
6. If the user says everything correctly, no correction is needed.
7. Consider the fact the user may not have a keyboard in the target language so may not be able to always use the correct accents and punctuation when spelling a word.


**Example:**
User: “Yo comí manzanas ayer.”
Assistant:
“Correction (in {payload.source_language}):
It looks like you were trying to say ‘I ate apples yesterday.’
The correct Spanish is 'Ayer comí manzanas', because...”

Conversational response:
Cuéntame más sobre otras frutas que te gusten.
""".strip()
        pieces.append(tutor_prompt)

        full_system = "\n\n".join(pieces)
        resp = client.chat.completions.create(
            model="gpt-4.1",
            messages=[{"role": "system", "content": full_system}],
            stream=False,
        )
        assistant_text = resp.choices[0].message.content or ""
        db.add(
            Message(
                conversation_id=conv.id,
                sender="bot",
                content=assistant_text.strip(),
            )
        )
        await db.commit()

    # 3) re‐load with messages eager-loaded
    stmt = (
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conv.id)
    )
    result = await db.execute(stmt)
    conv_with_msgs = result.scalar_one()

    # sort messages chronologically
    conv_with_msgs.messages.sort(key=lambda m: m.created_at)
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
    convs = result.scalars().all()

    # sort each conversation's messages oldest→newest
    for conv in convs:
        conv.messages.sort(key=lambda m: m.created_at)

    return convs


@router.get("/{conversation_id}", response_model=ConversationRead)
async def get_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(fastapi_users.current_user())
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

    # ensure chronological order
    conv.messages.sort(key=lambda m: m.created_at)
    return conv


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(fastapi_users.current_user())
):
    """ Delete a conversation. """
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.user_id != user.id:
        raise HTTPException(status_code=404, detail="Not Found")
    await db.delete(conv)
    await db.commit()
    return {"detail": "deleted"}
