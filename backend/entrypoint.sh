set -e

# wait for Postgres to be ready
until pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" -U "${DB_USER}"; do
  echo "⏳ waiting for database..."
  sleep 1
done

cd /app
alembic upgrade head

# launch Uvicorn
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
