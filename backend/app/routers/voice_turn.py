# backend/app/routers/voice_turn.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os
from dotenv import load_dotenv
from openai import OpenAI

from ..users import fastapi_users, UserRead
from ..routers.conversations import get_db
from ..models import Conversation as ConvModel, Message as MessageModel

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()


class VoiceTurnIn(BaseModel):
    text: str
    native_language: str
    target_language: str
    conversation_id: str
    prompt: str | None = None


@router.post("/voice-turn")
async def voice_turn(
    msg: VoiceTurnIn,
    user: UserRead = Depends(fastapi_users.current_user()),
    db: AsyncSession = Depends(get_db),
):
    # 1) ensure conversation exists
    conv = await db.get(ConvModel, msg.conversation_id)
    if not conv or conv.user_id != user.id:
        raise HTTPException(404, "Conversation not found")

    # 2) persist the user's message
    db.add(
        MessageModel(
            conversation_id=conv.id,
            sender="user",
            content=msg.text,
        )
    )
    await db.commit()

    # 3) load full history for this conversation
    stmt = (
        select(MessageModel)
        .where(MessageModel.conversation_id == conv.id)
        .order_by(MessageModel.created_at)
    )
    result = await db.execute(stmt)
    history = result.scalars().all()

    # 4) build the system instructions
    parts: list[str] = []
    if conv.prompt:
        parts.append(f"Context: {conv.prompt.strip()}")

    tutor = f"""
You are a friendly {msg.target_language} tutor.
The user’s native language is {msg.native_language},
and they want to practice {msg.target_language}.

**Rules:**
1. Only ever use {msg.target_language} in your conversation—unless you are correcting a mistake.
2. When you correct, **first** present the correction _in {msg.native_language}_, with a heading "Correction",
   then leave a blank line, then continue your reply _in {msg.target_language}_
   with a heading "Conversational response".
3. The correction must **never** be in {msg.target_language}.
4. The correction should explain why the user's attempt was wrong and why the correction is right.
5. Always include exactly one blank line between the correction and the reply.
""".strip()

    parts.append(tutor)

    # 5) assemble the messages array
    payload_messages: list[dict] = []
    for part in parts:
        payload_messages.append({"role": "system", "content": part})
    for m in history:
        role = "assistant" if m.sender == "assistant" else "user"
        payload_messages.append({"role": role, "content": m.content})

    # 6) call OpenAI
    resp = client.chat.completions.create(
        model="gpt-4.1",
        messages=payload_messages,
        stream=False,
    )
    assistant_text = resp.choices[0].message.content or ""

    # 7) save assistant reply
    db.add(
        MessageModel(
            conversation_id=conv.id,
            sender="assistant",
            content=assistant_text.strip(),
        )
    )
    await db.commit()

    # 8) return for TTS playback
    return {"assistant_text": assistant_text}
