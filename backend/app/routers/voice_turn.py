# backend/app/routers/voice_turn.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
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

    # 2) save the user’s “spoken” message as text
    db.add(
        MessageModel(
            conversation_id=conv.id,
            sender="user",
            content=msg.text,
        )
    )
    await db.commit()

    # 3) build your system+user prompt exactly as in /chat
    parts: list[str] = []
    if msg.prompt:
        parts.append(f"Context: {msg.prompt.strip()}")

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
4. The correction should explain the reason what they said was incorrect, and why the correction is correct.
5. Always include exactly one blank line between correction and reply.  

**Example:**  
User: “Yo comí manzanas ayer.”  
Assistant:  
“Correction (in {msg.native_language}):  
It looks like you were trying to say ‘I ate apples yesterday.’  
The correct way to say this in Spanish would be 'Ayer comí manzanas', because...  

Conversational Response:  
Cuéntame más sobre qué otras frutas te gustan.”
—now continue the conversation based on this context.
""".strip()
    parts.append(tutor)
    system_content = "\n\n".join(parts)

    chat_msg = [
        {"role": "system", "content": system_content},
        {"role": "user", "content": msg.text},
    ]

    # 4) fire off a non‑streaming chat completion so you get the full reply
    resp = client.chat.completions.create(
        model="gpt-4.1",
        messages=chat_msg,
        stream=False,
    )
    assistant_text = resp.choices[0].message.content or ""

    # 5) persist assistant reply
    db.add(
        MessageModel(
            conversation_id=conv.id,
            sender="assistant",
            content=assistant_text.strip(),
        )
    )
    await db.commit()

    # 6) return the text (your frontend VoiceOverlay will then TTS it)
    return {"assistant_text": assistant_text}
