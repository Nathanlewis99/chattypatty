from fastapi import APIRouter
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()

class Message(BaseModel):
    text: str
    topic: str = None
    native_language: str
    target_language: str


@router.post("/chat")
async def chat(msg: Message):
    prompt = (
        "You are a friendly {msg.target_language} tutor."
        "The users native language is {msg.native_language}, and the language the user would like to learn and practice is {msg.target_language}."
        "Only speak {msg.target_language} unless correcting a mistake, in which case, the correction should be in {msg.native_language}. "
        "In circumstances where there is a correction, your response should be split into two parts. First, the correction, provided in {msg.native_language}. The conversational response should be in {msg.target_language}."
        "Be conversational and follow the user's line of conversation. "
        "Replicate a normal dialogue. "
        "Your job is to help the user learn {msg.target_language}."
    )

    # fix typo here: use msg.text
    conversation = [
        {"role": "system", "content": prompt},
        {"role": "user",   "content": msg.text}
    ]

    response = client.chat.completions.create(
        model="gpt-4.1",
        messages=conversation,
        # stream=True   --- turn this on, will need additional configuration to process chunks at real time.
    )
    return {"reply": response.choices[0].message.content}

