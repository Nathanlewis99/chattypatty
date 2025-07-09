# backend/app/models.py
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String
from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from app.db import Base


class UserTable(SQLAlchemyBaseUserTableUUID, Base):
    """
    This gives you:
      - id: UUID primary key
      - email, hashed_password, is_active, is_superuser, is_verified
    """
    __tablename__ = "user"
    full_name = Column(String, nullable=True)
