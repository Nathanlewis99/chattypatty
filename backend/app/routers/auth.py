import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

from ..db import AsyncSessionLocal
from ..models import UserTable

# ── ENV VARS ────────────────────────────────────────────────────────────
SECRET_KEY     = os.getenv("SECRET_KEY", "CHANGE_THIS_IN_PROD")
TOKEN_SALT     = "email-confirm"
TOKEN_EXPIRE   = int(os.getenv("VERIFY_EXPIRE_SECONDS", 3600))
FRONTEND_URL   = os.getenv("FRONTEND_URL", "http://localhost:3000")

MAIL_USERNAME = os.getenv("SMTP_USER", "")
MAIL_PASSWORD = os.getenv("SMTP_PASS", "")
MAIL_FROM     = os.getenv("EMAIL_FROM", "no-reply@example.com")
MAIL_PORT     = int(os.getenv("SMTP_PORT", 587))
MAIL_SERVER   = os.getenv("SMTP_HOST", "smtp.example.com")
MAIL_STARTTLS = True
MAIL_SSL_TLS  = False

conf = ConnectionConfig(
    MAIL_USERNAME=MAIL_USERNAME,
    MAIL_PASSWORD=MAIL_PASSWORD,
    MAIL_FROM=MAIL_FROM,
    MAIL_PORT=MAIL_PORT,
    MAIL_SERVER=MAIL_SERVER,
    MAIL_STARTTLS=MAIL_STARTTLS,
    MAIL_SSL_TLS=MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
)
serializer = URLSafeTimedSerializer(SECRET_KEY)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterIn(BaseModel):
    full_name: Optional[str]
    email: EmailStr
    password: str


class ResendIn(BaseModel):
    email: EmailStr


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: RegisterIn, db: AsyncSession = Depends(get_db)):
    # 1) Prevent dupes
    q = await db.execute(select(UserTable).where(UserTable.email == data.email))
    if q.scalars().first():
        raise HTTPException(400, "Email already registered")

    # 2) Create inactive user
    from passlib.context import CryptContext
    PWD_CTX = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed = PWD_CTX.hash(data.password)
    user = UserTable(
        full_name=data.full_name,
        email=data.email,
        hashed_password=hashed,
        is_active=False,
        is_verified=False,
    )
    db.add(user)
    await db.commit()

    # 3) Send verification email
    token = serializer.dumps(data.email, salt=TOKEN_SALT)
    link = f"{FRONTEND_URL}/auth/verify?token={token}"
    message = MessageSchema(
        subject="Please verify your email",
        recipients=[data.email],
        body=(
            f"Hi {data.full_name or data.email},\n\n"
            f"Click here to verify your email:\n\n{link}\n\n"
            "If you didn't sign up you can ignore this."
        ),
        subtype="plain",
    )
    await FastMail(conf).send_message(message)
    return {"msg": "User created; verification email sent."}


@router.get("/verify")
async def verify(token: str, db: AsyncSession = Depends(get_db)):
    try:
        email = serializer.loads(token, salt=TOKEN_SALT, max_age=TOKEN_EXPIRE)
    except SignatureExpired:
        raise HTTPException(400, "Token expired")
    except BadSignature:
        raise HTTPException(400, "Invalid token")

    q = await db.execute(select(UserTable).where(UserTable.email == email))
    user = q.scalars().first()
    if not user:
        raise HTTPException(404, "User not found")

    user.is_active = True
    user.is_verified = True
    await db.commit()
    return {"msg": "Email verified successfully."}


@router.post("/verify/resend")
async def resend_verification(data: ResendIn, db: AsyncSession = Depends(get_db)):
    q = await db.execute(select(UserTable).where(UserTable.email == data.email))
    user = q.scalars().first()
    if not user:
        raise HTTPException(404, "User not found")

    token = serializer.dumps(data.email, salt=TOKEN_SALT)
    link = f"{FRONTEND_URL}/auth/verify?token={token}"
    message = MessageSchema(
        subject="Your verification link",
        recipients=[data.email],
        body=f"Click to verify:\n\n{link}",
        subtype="plain",
    )
    await FastMail(conf).send_message(message)
    return {"msg": "Verification email resent."}
