from fastapi_users import schemas
from pydantic import BaseModel
from uuid import UUID
import uuid
from datetime import datetime
from typing import List, Optional


class User(schemas.BaseUser):
    full_name: str | None


class UserCreate(schemas.BaseUserCreate):
    full_name: str | None


class UserUpdate(schemas.BaseUserUpdate):
    full_name: str | None


class UserRead(schemas.BaseUser[uuid.UUID]):
    full_name: Optional[str]


class MessageRead(BaseModel):
    id: UUID
    sender: str
    content: str
    created_at: datetime


class ConversationRead(BaseModel):
    id: UUID
    source_language: str
    target_language: str
    created_at: datetime
    messages: List[MessageRead] = []


class ConversationCreate(BaseModel):
    source_language: str
    target_language: str


class MessageCreate(BaseModel):
    conversation_id: UUID
    content: str


