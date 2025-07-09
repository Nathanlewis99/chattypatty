import os
from typing import AsyncGenerator, Optional
from uuid import UUID

from fastapi import Depends, Request
from fastapi_users import FastAPIUsers, schemas
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users.manager import BaseUserManager, UUIDIDMixin
from fastapi_users.db import SQLAlchemyUserDatabase

from .db import AsyncSessionLocal
from .models import UserTable


# ————— Pydantic “schemas” for the API —————

class UserRead(schemas.BaseUser[UUID]):
    """
    Returned in responses for endpoints like /users/me
    Inherits: id, email, is_active, is_verified, is_superuser
    """
    full_name: Optional[str]


class UserCreate(schemas.BaseUserCreate):
    """
    Used for the registration payload.
    """
    full_name: Optional[str]


class UserUpdate(schemas.BaseUserUpdate):
    """
    Used for user-update payloads.
    """
    full_name: Optional[str]


# ————— Database adapter & UserManager —————

async def get_user_db() -> AsyncGenerator[SQLAlchemyUserDatabase, None]:
    """
    Yields the SQLAlchemy adapter bound to your ORM model.
    """
    async with AsyncSessionLocal() as session:
        yield SQLAlchemyUserDatabase(session, UserTable)


SECRET = os.getenv("SECRET_KEY", "CHANGE_THIS_IN_PROD")

class UserManager(UUIDIDMixin, BaseUserManager[UserTable, UUID]):
    """
    Handles password hashing, registration events, etc.
    """
    reset_password_token_secret = SECRET
    verification_token_secret   = SECRET

    async def on_after_register(
        self, 
        user: UserTable, 
        request: Optional[Request] = None
    ):
        print(f"New user registered: {user.id}")


async def get_user_manager(
    user_db=Depends(get_user_db),
) -> AsyncGenerator[UserManager, None]:
    yield UserManager(user_db)


# ————— JWT authentication backend —————

bearer_transport = BearerTransport(tokenUrl="/auth/jwt/login")

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

# ————— fastapi_users instance & Routers —————

fastapi_users = FastAPIUsers[UserTable, UUID](
    get_user_manager,
    [auth_backend],
)

auth_router = fastapi_users.get_auth_router(auth_backend)


register_router = fastapi_users.get_register_router(
    UserRead,
    UserCreate,
)

reset_router  = fastapi_users.get_reset_password_router()
verify_router = fastapi_users.get_verify_router(UserRead)

users_router  = fastapi_users.get_users_router(
    UserRead,
    UserUpdate,
)