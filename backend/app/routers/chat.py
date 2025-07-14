from fastapi import APIRouter, Depends
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from openai import OpenAI
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..users import fastapi_users, UserRead
from .conversations import get_db  # ← your new dependency

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()

class Message(BaseModel):
    text: str
    topic: str = None
    native_language: str
    target_language: str

@router.post("/chat")
async def chat(
    msg: Message,
    user: UserRead = Depends(fastapi_users.current_user()),
    db: AsyncSession = Depends(get_db),      # ← new DB session
):
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

    conversation = [
        {"role": "system", "content": prompt},
        {"role": "user",   "content": msg.text}
    ]

    def generate():
        stream = client.chat.completions.create(
            model="gpt-4.1",
            messages=conversation,
            stream=True
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    return StreamingResponse(generate(), media_type="text/plain")
