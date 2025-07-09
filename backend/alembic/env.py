import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from sqlalchemy.engine.url import make_url
from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# bring in your models’ metadata
from app.db     import Base         # DeclarativeBase subclass
from app.models import UserTable    # ensure this import so migrations pick it up

target_metadata = Base.metadata


# grab the async URL from env or ini, then strip off +asyncpg for sync migrations
db_url   = os.getenv("DATABASE_URL") or config.get_main_option("sqlalchemy.url")
url_obj  = make_url(db_url)
sync_url = str(url_obj.set(drivername=url_obj.get_backend_name()))


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    context.configure(
        url=sync_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # ← here we pass a one-off dict containing the sync URL
    connectable = engine_from_config(
        {"sqlalchemy.url": sync_url},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,  # optional: detect column type changes
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
