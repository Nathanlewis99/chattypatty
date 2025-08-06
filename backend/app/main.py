from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import chat, languages, conversations, stt, tts, voice_turn, auth
from .users import (
    auth_router,
    reset_router,
    users_router,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# your non-auth routers
app.include_router(languages.router)
app.include_router(conversations.router)
app.include_router(chat.router)

# custom register/verify
app.include_router(auth.router)

# FastAPI-Users login only
app.include_router(auth_router,     prefix="/auth/jwt", tags=["auth"])
app.include_router(reset_router,    prefix="/auth",     tags=["auth"])
app.include_router(users_router,    prefix="/users",    tags=["users"])

# everything else
app.include_router(stt.router)
app.include_router(tts.router)
app.include_router(voice_turn.router, prefix="", tags=["voice"])
