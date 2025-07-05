from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    text: str
    topic: str = None


@app.post("/chat")
async def chat(msg: Message):
    prompt = (
        "You are a friendly Spanish tutor. "
        "Only speak Spanish unless correcting a mistake in English. "
        "Be conversational and follow the user's line of conversation. "
        "Replicate a normal dialogue. "
        "Your job is to help the user learn Spanish."
    )

    # fix typo here: use msg.text
    conversation = [
        {"role": "system", "content": prompt},
        {"role": "user",   "content": msg.text}
    ]

    response = client.chat.completions.create(
        model="gpt-4.1",
        messages=conversation
    )
    return {"reply": response.choices[0].message.content}
