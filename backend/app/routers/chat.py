# app/routers/chat.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from openai import OpenAI
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..users import fastapi_users, UserRead
from ..routers.conversations import get_db  # your existing DB‐session dependency
from ..models import Message as MessageModel, Conversation as ConvModel

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()


class MessageIn(BaseModel):
    text: str
    topic: str = None
    native_language: str
    target_language: str
    # conversation_id is optional: if this is the very first message, front-end will have created the conv already
    conversation_id: str | None = None


@router.post("/chat")
async def chat(
    msg: MessageIn,
    user: UserRead = Depends(fastapi_users.current_user()),
    db: AsyncSession = Depends(get_db),
):
    # 1) ensure conversation exists and belongs to this user
    if not msg.conversation_id:
        raise HTTPException(400, "conversation_id is required")
    conv = await db.get(ConvModel, msg.conversation_id)
    if not conv or conv.user_id != user.id:
        raise HTTPException(404, "Conversation not found")

    # 2) persist the user's message
    user_msg = MessageModel(
        conversation_id=conv.id,
        sender="user",
        content=msg.text,
    )
    db.add(user_msg)
    await db.commit()

    # 3) prepare streaming + accumulation buffer for assistant reply
    assistant_reply = ""

    async def streamer():
        nonlocal assistant_reply
        # build system + user prompt
        prompt = f"""
        You are a friendly {msg.target_language} tutor.  
        The user’s native language is {msg.native_language},  
        and they want to practice {msg.target_language}.  

        **Rules:**  
        1. Only ever use {msg.target_language} in your conversation—unless you are correcting a mistake.  
        2. When you correct, **first** present the correction _in {msg.native_language}_, with a heading named "Correction", then leave a blank line, then continue your conversational reply _in {msg.target_language}_, with a heading named "Conversational response".  
        3. The correction must **never** be in {msg.target_language}.  
        4. Always include exactly one blank line between the correction and the reply.  

        **Example:**  
        User: “Yo comí manzanas ayer.”  
        Assistant:  
        “Correction (in {msg.native_language}):
        It looks like you were trying to say ‘I ate apples yesterday.’
        The correct way to say this in Spanish would be 'Ayer comí manzanas', because..." (assistant then explains why in {msg.native_language}).   
                                                                            
        Conversational Response:
        Cuéntame más sobre qué otras frutas te gustan.”
        Notice the whitespace after the correction and before the conversational response.
        —now continue the conversation based on what the user said.
        """

        messages = [
            {"role": "system", "content": prompt},
            {"role": "user",   "content": msg.text}
        ]

        stream = client.chat.completions.create(
            model="gpt-4.1",
            messages=messages,
            stream=True
        )

        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                assistant_reply += delta
                yield delta

        # 4) once the stream is done, save the assistant’s full reply
        bot_msg = MessageModel(
            conversation_id=conv.id,
            sender="assistant",
            content=assistant_reply.strip(),
        )
        db.add(bot_msg)
        await db.commit()

    return StreamingResponse(streamer(), media_type="text/plain")
