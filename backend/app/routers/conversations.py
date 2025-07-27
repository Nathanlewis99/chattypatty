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
        prompt=payload.prompt,  # save the scenario prompt if provided
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    # 2) if the user supplied a prompt, fire off an assistant reply
    if payload.prompt:
        # 2a) build the combined system prompt
        pieces: List[str] = []

        # • first the user‐supplied scenario prompt
        pieces.append(f"Context: {payload.prompt.strip()}")

        # • then the default tutor instructions
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
4. The correction should explain the reason what they said was incorrect, and why the correction is correct.
5. Always include exactly one blank line between correction and reply.  

**Example:**  
User: “Yo comí manzanas ayer.”  
Assistant:  
“Correction (in {payload.source_language} (use the full verbose name for the language (for example "English" rather than "ES"))):  
It looks like you were trying to say ‘I ate apples yesterday.’  
The correct way to say this in Spanish would be 'Ayer comí manzanas', because...  

Conversational Response:  
Cuéntame más sobre qué otras frutas te gustan.”
—now continue the conversation based on this context.
""".strip()

        pieces.append(tutor_prompt)

        full_system = "\n\n".join(pieces)

        # 2b) call OpenAI once, non‐streaming
        resp = client.chat.completions.create(
            model="gpt-4.1",
            messages=[{"role": "system", "content": full_system}],
            stream=False,
        )
        assistant_text = resp.choices[0].message.content or ""

        # 2c) persist that reply as the first bot message
        msg = Message(
            conversation_id=conv.id,
            sender="bot",
            content=assistant_text.strip(),
        )
        db.add(msg)
        await db.commit()

    # 3) re‐load with messages eager-loaded
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
    return conv


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(fastapi_users.current_user())
):
    """ Delete a conversation."""
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.user_id != user.id:
        raise HTTPException(status_code=404, detail="Not Found")
    await db.delete(conv)
    await db.commit()
    return {"detail": "deleted"}
