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

# ── Environment vars ───────────────────────────────────────────────────────────
SMTP_HOST  = os.getenv("SMTP_HOST", "smtp.example.com")
SMTP_PORT  = int(os.getenv("SMTP_PORT", 587))
SMTP_USER  = os.getenv("SMTP_USER", "")
SMTP_PASS  = os.getenv("SMTP_PASS", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "no-reply@chattypatty.com")
SECRET     = os.getenv("SECRET_KEY", "CHANGE_THIS_IN_PROD")
# ────────────────────────────────────────────────────────────────────────────────

async def get_user_db() -> AsyncGenerator[SQLAlchemyUserDatabase, None]:
    async with AsyncSessionLocal() as session:
        yield SQLAlchemyUserDatabase(session, UserTable)


class UserManager(UUIDIDMixin, BaseUserManager[UserTable, UUID]):
    reset_password_token_secret   = SECRET
    verification_token_secret     = SECRET

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

        # logging
        print(f"[send_verification_request] Sending verification email to: {user.email}")
        print(f"[send_verification_request] SMTP host={SMTP_HOST}, port={SMTP_PORT}, from={EMAIL_FROM}")

        try:
            await aiosmtplib.send(
                message,
                hostname=SMTP_HOST,
                port=SMTP_PORT,
                start_tls=True,
                username=SMTP_USER,
                password=SMTP_PASS,
            )
            print("[send_verification_request] Email sent successfully")
        except Exception as e:
            print(f"[send_verification_request] Error sending email: {e}")
            raise

    async def on_after_register(
        self,
        user: UserTable,
        request: Optional[Request] = None
    ):
        print(f"[on_after_register] New user registered: id={user.id}, email={user.email}")

        if not request:
            print("[on_after_register] No request available, skipping verification email")
            return

        # generate a JWT token for email verification
        try:
            strategy = JWTStrategy(
                secret=self.verification_token_secret,
                lifetime_seconds=3600  # 1h validity
            )
            token = await strategy.write_token({"sub": str(user.id)})
            print(f"[on_after_register] Generated verification token: {token}")
        except Exception as e:
            print(f"[on_after_register] Error generating verification token: {e}")
            return

        # send the email
        try:
            await self.send_verification_request(user, token, request)
        except Exception as e:
            print(f"[on_after_register] Failed to send verification email: {e}")

    async def on_after_verify(
        self,
        user: UserTable,
        request: Optional[Request] = None
    ):
        print(f"[on_after_verify] User verified: id={user.id}, email={user.email}")
        user.is_active = True
        await self.user_db.update(user)


async def get_user_manager(
    user_db=Depends(get_user_db),
) -> AsyncGenerator[UserManager, None]:
    yield UserManager(user_db)


# ── JWT auth setup ─────────────────────────────────────────────────────────────
bearer_transport = BearerTransport(tokenUrl="/auth/jwt/login")

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)
# ────────────────────────────────────────────────────────────────────────────────


# ── fastapi_users & routers ────────────────────────────────────────────────────
fastapi_users   = FastAPIUsers[UserTable, UUID](get_user_manager, [auth_backend])
auth_router     = fastapi_users.get_auth_router(auth_backend)
register_router = fastapi_users.get_register_router(UserRead, UserCreate)
reset_router    = fastapi_users.get_reset_password_router()
verify_router   = fastapi_users.get_verify_router(UserRead)
users_router    = fastapi_users.get_users_router(UserRead, UserUpdate)
# ────────────────────────────────────────────────────────────────────────────────
