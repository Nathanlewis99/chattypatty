# backend/app/routers/voice_turn.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
from openai import OpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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
    conversation_id: str | None = None
    prompt: str | None = None


@router.post("/voice-turn")
async def voice_turn(
    msg: VoiceTurnIn,
    user: UserRead = Depends(fastapi_users.current_user()),
    db: AsyncSession = Depends(get_db),
):
    # ── 0) Ensure conversation (same as /chat)
    if msg.conversation_id:
        conv = await db.get(ConvModel, msg.conversation_id)
        if not conv or conv.user_id != user.id:
            raise HTTPException(404, "Conversation not found")
        # if a prompt came in and none was saved, persist it
        if msg.prompt and not conv.prompt:
            conv.prompt = msg.prompt.strip()
            db.add(conv)
            await db.commit()
            await db.refresh(conv)
    else:
        conv = ConvModel(
            user_id=user.id,
            source_language=msg.native_language,
            target_language=msg.target_language,
            prompt=msg.prompt.strip() if msg.prompt else None,
        )
        db.add(conv)
        await db.commit()
        await db.refresh(conv)

    # ── 1) Persist the user’s “spoken” message
    db.add(
        MessageModel(
            conversation_id=conv.id,
            sender="user",
            content=msg.text,
        )
    )
    await db.commit()

    # ── 2) Build system instructions (same as /chat)
    parts: list[str] = []
    if conv.prompt:
        parts.append(f"Context: {conv.prompt.strip()}")

    tutor = f"""
You are a friendly {msg.target_language} tutor.
Your name is Chatty Patty (Patty for short).
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
6. If the user says everything correctly, no correction is needed.

**Example:**
User: “Yo comí manzanas ayer.”
Assistant:
“Correction (in {msg.native_language} (use the full verbose name for the language (for example "English" rather than "ES")):
It looks like you were trying to say ‘I ate apples yesterday.’
The correct way to say this in Spanish would be 'Ayer comí manzanas', because...”

Conversational response:
Cuéntame más sobre otras frutas que te gusten.
""".strip()
    parts.append(tutor)

    system_content = "\n\n".join(parts)

    # ── 3) Call OpenAI (non‑streaming)
    resp = client.chat.completions.create(
        model="gpt-4.1",
        messages=[
            {"role": "system", "content": system_content},
            {"role": "user",   "content": msg.text},
        ],
        stream=False,
    )
    assistant_text = resp.choices[0].message.content or ""

    # ── 4) Persist assistant reply
    db.add(
        MessageModel(
            conversation_id=conv.id,
            sender="assistant",
            content=assistant_text.strip(),
        )
    )
    await db.commit()

    # ── 5) Return assistant text for TTS
    return JSONResponse({"assistant_text": assistant_text})
