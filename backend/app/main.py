from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import chat, languages
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

app.include_router(languages.router)
app.include_router(chat.router)

app.include_router(auth_router,     prefix="/auth/jwt", tags=["auth"])
app.include_router(register_router, prefix="/auth",     tags=["auth"])
app.include_router(reset_router,    prefix="/auth",     tags=["auth"])
app.include_router(verify_router,   prefix="/auth",     tags=["auth"])
app.include_router(users_router,    prefix="/users",    tags=["users"])