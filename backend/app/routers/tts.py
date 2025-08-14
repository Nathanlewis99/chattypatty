# backend/app/routers/tts.py

import os
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from elevenlabs.client import ElevenLabs
from ..users import fastapi_users, UserRead

load_dotenv()

ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")
if not ELEVEN_API_KEY:
    raise RuntimeError("ELEVEN_API_KEY environment variable is required for TTS")

# Instantiate the ElevenLabs client
client = ElevenLabs(api_key=ELEVEN_API_KEY)

router = APIRouter(prefix="/tts", tags=["tts"])


class TTSRequest(BaseModel):
    text: str


@router.post("", response_class=StreamingResponse)
async def tts(
    body: TTSRequest,
    user: UserRead = Depends(fastapi_users.current_user()),
):
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text required")

    # 1) fetch available voices
    try:
        resp = client.voices.search()      # use the new .voices.search() endpoint
        voices_list = resp.voices
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch TTS voices: {e}")

    if not voices_list:
        raise HTTPException(status_code=500, detail="No TTS voices available")
    voice_id = voices_list[0].voice_id

    # 2) generate the audio as a streaming generator
    try:
        audio_stream = client.text_to_speech.convert(
            text=text,
            voice_id=voice_id,
            model_id="eleven_multilingual_v2",  # recommended default
            output_format="mp3_44100_128",       # you can adjust bitrate/sample rate here
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"TTS API error: {e}")

    # 3) stream it back directly—FastAPI will chunk it out and CORS will apply
    return StreamingResponse(
        audio_stream,
        media_type="audio/mpeg",
        headers={"Cache-Control": "no-transform"}
    )
