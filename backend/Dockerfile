FROM python:3.11-slim

# 1) OS deps for Postgres and audio
RUN apt-get update && apt-get install -y --no-install-recommends \
      postgresql-client \
      ffmpeg \
      libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# 2) Set workdir
WORKDIR /app

# 3) Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4) Copy Alembic config & migrations
COPY alembic.ini alembic/ ./alembic/
RUN mkdir -p alembic/version

# 5) Copy and make entrypoint executable
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# 6) Copy application code
COPY app ./app

# 7) Ensure logs aren’t buffered
ENV PYTHONUNBUFFERED=1

# 8) Use the entrypoint to run migrations then start Uvicorn
ENTRYPOINT ["sh", "./entrypoint.sh"]
