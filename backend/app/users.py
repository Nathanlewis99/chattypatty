# backend/app/users.py
import os
from typing import AsyncGenerator, Optional
from uuid import UUID
from fastapi import Depends, Request, HTTPException
from fastapi_users import FastAPIUsers
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users.manager import BaseUserManager, UUIDIDMixin
from fastapi_users.db import SQLAlchemyUserDatabase

from .db import AsyncSessionLocal
from .models import UserTable
from .schemas import UserRead, UserCreate, UserUpdate

# for sending email
import aiosmtplib
from email.message import EmailMessage

SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.example.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", 587))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASS     = os.getenv("SMTP_PASS", "")
EMAIL_FROM    = os.getenv("EMAIL_FROM", "no-reply@chattypatty.com")
SECRET        = os.getenv("SECRET_KEY", "CHANGE_THIS_IN_PROD")

async def get_user_db() -> AsyncGenerator[SQLAlchemyUserDatabase, None]:
    async with AsyncSessionLocal() as session:
        yield SQLAlchemyUserDatabase(session, UserTable)

class UserManager(UUIDIDMixin, BaseUserManager[UserTable, UUID]):
    reset_password_token_secret = SECRET
    verification_token_secret   = SECRET

    # Called by the built‑in /auth/users/verify/send endpoint, and also on first register
    async def send_verification_request(
        self,
        user: UserTable,
        token: str,
        request: Optional[Request] = None,
    ):
        if request is None:
            raise HTTPException(500, "No request in verification")
        verify_url = (
            f"{request.url.scheme}://{request.url.hostname}"
            f"/auth/users/verify?token={token}"
        )
        # build the email
        message = EmailMessage()
        message["From"]    = EMAIL_FROM
        message["To"]      = user.email
        message["Subject"] = "Please verify your email"
        message.set_content(
            f"Hi {user.full_name or user.email},\n\n"
            f"Thanks for signing up to ChattyPatty! Please verify your email by clicking:\n\n"
            f"{verify_url}\n\n"
            "If you didn't request this, you can ignore this email.\n"
        )
        # send it
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_USER,
            password=SMTP_PASS,
        )

    # once the user clicks the link & is_verified is set,
    # activate the account so they can log in
    async def on_after_verify(
        self,
        user: UserTable,
        request: Optional[Request] = None,
    ):
        user.is_active = True
        await self.user_db.update(user)

async def get_user_manager(
    user_db=Depends(get_user_db),
) -> AsyncGenerator[UserManager, None]:
    yield UserManager(user_db)

# — JWT auth setup (unchanged) —
bearer_transport = BearerTransport(tokenUrl="/auth/jwt/login")
def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

# — fastapi_users and routers —
fastapi_users = FastAPIUsers[UserTable, UUID](
    get_user_manager,
    [auth_backend],
)

auth_router     = fastapi_users.get_auth_router(auth_backend)
register_router = fastapi_users.get_register_router(UserRead, UserCreate)
reset_router    = fastapi_users.get_reset_password_router()
verify_router   = fastapi_users.get_verify_router(UserRead)
users_router    = fastapi_users.get_users_router(UserRead, UserUpdate)
