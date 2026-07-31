#!/usr/bin/env bash
# Restore the production Postgres database on the VPS from a pg_dump custom-format backup.
# Usage: ./scripts/restore.sh [path/to/backup_file]
# If no path is given, restores the most recently modified file in backups/.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/backend/.env.production"
BACKUP_DIR="$ROOT_DIR/backups"
COMPOSE="docker compose -f $ROOT_DIR/docker-compose.prod.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found." >&2
  exit 1
fi

POSTGRES_USER=$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | tail -n1 | cut -d '=' -f2-)
POSTGRES_DB=$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | tail -n1 | cut -d '=' -f2-)

if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_DB" ]; then
  echo "ERROR: POSTGRES_USER / POSTGRES_DB not set in $ENV_FILE" >&2
  exit 1
fi

BACKUP_FILE="${1:-}"
if [ -z "$BACKUP_FILE" ]; then
  # shellcheck disable=SC2012
  BACKUP_FILE=$(ls -1t "$BACKUP_DIR"/rentflow_*.backup 2>/dev/null | head -n1 || true)
fi

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: no backup file found. Pass a path explicitly: ./scripts/restore.sh backups/rentflow_XXXX.backup" >&2
  exit 1
fi

echo "About to restore '$BACKUP_FILE' into database '$POSTGRES_DB' (user '$POSTGRES_USER')."
echo "This will DROP and recreate existing objects (pg_restore --clean --if-exists). Ctrl+C to cancel."
read -r -p "Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

$COMPOSE exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists < "$BACKUP_FILE"

echo "Restore complete."
