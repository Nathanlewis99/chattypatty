# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import chat, languages, conversations
from .users import (
    auth_router,
    register_router,
    reset_router,
    verify_router,
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

# public routers
app.include_router(languages.router)      # now GET /languages?target=…
app.include_router(conversations.router)  # now GET /conversations
app.include_router(chat.router)           # POST /chat

# auth / user management
app.include_router(auth_router,     prefix="/auth/jwt", tags=["auth"])
app.include_router(register_router, prefix="/auth",     tags=["auth"])
app.include_router(reset_router,    prefix="/auth",     tags=["auth"])
app.include_router(verify_router,   prefix="/auth",     tags=["auth"])
app.include_router(users_router,    prefix="/users",    tags=["users"])
