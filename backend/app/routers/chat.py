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
    prompt: str | None = None  # scenario prompt


@router.post("/chat")
async def chat(
    msg: MessageIn,
    user: UserRead = Depends(fastapi_users.current_user()),
    db: AsyncSession = Depends(get_db),
):
    if not msg.conversation_id:
        raise HTTPException(400, "conversation_id is required")
    conv = await db.get(ConvModel, msg.conversation_id)
    if not conv or conv.user_id != user.id:
        raise HTTPException(404, "Conversation not found")

    # 1) persist the user's message
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

        # build up the system prompt pieces
        parts: list[str] = []

        if msg.prompt:
            parts.append(f"Context: {msg.prompt.strip()}")

        # your existing tutor instructions
        tutor = f"""
You are a friendly {msg.target_language} tutor.
Your name is Chatty Patty, (patty for short).  
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
The correct Spanish is 'Ayer comí manzanas', because..."  

Conversational response:  
Cuéntame más sobre otras frutas que te gusten.
""".strip()

        parts.append(tutor)
        system_content = "\n\n".join(parts)

        chat_payload = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": msg.text},
        ]

        # 2) openai stream call
        stream = client.chat.completions.create(
            model="gpt-4.1",
            messages=chat_payload,
            stream=True,
        )

        # ← here: synchronous iteration, not async for
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                assistant_reply += delta
                yield delta

        # 3) once done, save the full assistant reply
        db.add(
            MessageModel(
                conversation_id=conv.id,
                sender="assistant",
                content=assistant_reply.strip(),
            )
        )
        await db.commit()

    return StreamingResponse(streamer(), media_type="text/plain")
