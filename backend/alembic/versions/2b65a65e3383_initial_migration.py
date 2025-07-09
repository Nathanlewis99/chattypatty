"""initial migration

Revision ID: 2b65a65e3383
Revises:
Create Date: 2025-07-08 17:31:26.884754
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# ← import GUID once, up here
from fastapi_users_db_sqlalchemy.generics import GUID  


# revision identifiers, used by Alembic.
revision: str = "2b65a65e3383"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user",
        sa.Column("full_name", sa.String(), nullable=True),
        # ← use the imported GUID() directly
        sa.Column("id", GUID(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("hashed_password", sa.String(length=1024), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_superuser", sa.Boolean(), nullable=False),
        sa.Column("is_verified", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_email"), "user", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_email"), table_name="user")
    op.drop_table("user")
