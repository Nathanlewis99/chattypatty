from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query
import io
import os
from dotenv import load_dotenv
from openai import OpenAI
from ..users import fastapi_users, UserRead

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter(prefix="/stt", tags=["stt"])


@router.post("", summary="Transcribe uploaded audio via Whisper API")
async def transcribe_audio(
    file: UploadFile = File(...),
    user: UserRead = Depends(fastapi_users.current_user()),
    language: str = Query(..., description="ISO code (e.g. 'es') – Whisper will use this language"),
):
    # only accept common audio types
    if file.content_type not in {
        "audio/wav", "audio/mpeg", "audio/mp3",
        "audio/webm", "audio/x-wav", "audio/flac", "audio/ogg"
    }:
        raise HTTPException(400, "Unsupported audio format")

    audio_bytes = await file.read()
    resp = client.audio.transcriptions.create(
        file=io.BytesIO(audio_bytes),
        model="whisper-1",
        language=language,
        response_format="text"
    )
    return {"text": resp.text}
