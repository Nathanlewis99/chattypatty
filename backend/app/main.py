# backend/app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import chat, languages, conversations, stt, tts, voice_turn, auth, health
from .users import (
    auth_router,
    reset_router,
    users_router,
)

app = FastAPI()

# ---- CORS: read from env (comma-separated origins) ----
# Example value: "http://localhost:3000,http://your-alb-dns.amazonaws.com,https://yourdomain.com"
origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()
if origins_env:
    allow_origins = [o.strip() for o in origins_env.split(",") if o.strip()]
else:
    # sensible local default if nothing is set
    allow_origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Routers ----
# non-auth
app.include_router(languages.router)
app.include_router(conversations.router)
app.include_router(chat.router)

# health (for ALB / ops)
app.include_router(health.router)

# auth flows
app.include_router(auth.router)
app.include_router(auth_router,  prefix="/auth/jwt", tags=["auth"])
app.include_router(reset_router, prefix="/auth",     tags=["auth"])
app.include_router(users_router, prefix="/users",    tags=["users"])

# everything else
app.include_router(stt.router)
app.include_router(tts.router)
app.include_router(voice_turn.router, prefix="", tags=["voice"])
