# backend/app/routers/chat.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from openai import OpenAI
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..users import fastapi_users, UserRead
from ..routers.conversations import get_db
from ..models import Message as MessageModel, Conversation as ConvModel

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()


class MessageIn(BaseModel):
    text: str
    native_language: str
    target_language: str
    conversation_id: str | None = None
    prompt: str | None = None  # optional scenario prompt sent with this turn


@router.post("/chat")
async def chat(
    msg: MessageIn,
    user: UserRead = Depends(fastapi_users.current_user()),
    db: AsyncSession = Depends(get_db),
):
    """
    Stream a reply. If conversation_id is missing, create a new conversation on the fly.
    Merge (1) saved conversation.prompt, (2) per-message prompt, and (3) tutor instructions.
    """

    # ── 0) Ensure conversation
    if msg.conversation_id:
        conv = await db.get(ConvModel, msg.conversation_id)
        if not conv or conv.user_id != user.id:
            raise HTTPException(404, "Conversation not found")
        # update convo prompt if this turn provides a new one and none saved yet
        if msg.prompt and not conv.prompt:
            conv.prompt = msg.prompt.strip()
            db.add(conv)
            await db.commit()
            await db.refresh(conv)
    else:
        # Auto-create
        conv = ConvModel(
            user_id=user.id,
            source_language=msg.native_language,
            target_language=msg.target_language,
            prompt=msg.prompt.strip() if msg.prompt else None,
        )
        db.add(conv)
        await db.commit()
        await db.refresh(conv)

    # ── 1) Persist user's message
    db.add(
        MessageModel(
            conversation_id=conv.id,
            sender="user",
            content=msg.text,
        )
    )
    await db.commit()

    assistant_reply = ""

    async def streamer():
        nonlocal assistant_reply

        parts: list[str] = []

        # convo-level context
        if conv.prompt:
            parts.append(f"Context: {conv.prompt.strip()}")

        # turn-level context (avoid duplicating same text)
        if msg.prompt and (not conv.prompt or msg.prompt.strip() != conv.prompt.strip()):
            parts.append(f"Additional context: {msg.prompt.strip()}")

        # tutor block (kept as you wrote, with Patty persona)
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

**Example:**
User: “Yo comí manzanas ayer.”
Assistant:
“Correction (in {msg.native_language}):
It looks like you were trying to say ‘I ate apples yesterday.’
The correct Spanish is 'Ayer comí manzanas', because...”

Conversational response:
Cuéntame más sobre otras frutas que te gusten.
""".strip()

        parts.append(tutor)
        system_content = "\n\n".join(parts)

        chat_payload = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": msg.text},
        ]

        # ── 2) OpenAI stream (sync iterator)
        stream = client.chat.completions.create(
            model="gpt-4.1",
            messages=chat_payload,
            stream=True,
        )

        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                assistant_reply += delta
                yield delta

        # ── 3) Save assistant reply
        db.add(
            MessageModel(
                conversation_id=conv.id,
                sender="assistant",
                content=assistant_reply.strip(),
            )
        )
        await db.commit()

    return StreamingResponse(streamer(), media_type="text/plain")
