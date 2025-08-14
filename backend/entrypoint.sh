set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  echo "⏳ waiting for database..."
  sleep 1
done

cd /app
alembic upgrade head

# Dev and simple prod are fine with Uvicorn; you can switch to Gunicorn later.
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
