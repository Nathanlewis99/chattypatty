# backend/app/routers/health.py
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from fastapi import HTTPException, APIRouter

router = APIRouter()

@router.get("/api/health", tags=["health"])
async def health():
    return {"ok": True}


@router.get("/api/ready", tags=["health"])
async def ready():
    url = os.getenv("DATABASE_URL")
    if not url:
        return {"ok": True, "db": "unknown"}  # don't fail just for missing env
    engine = create_async_engine(url, pool_pre_ping=True, future=True)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"ok": True, "db": "up"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"db not ready: {e}")
    finally:
        await engine.dispose()
