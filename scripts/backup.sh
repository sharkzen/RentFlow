#!/usr/bin/env bash
# Backup the production Postgres database on the VPS.
# Usage: ./scripts/backup.sh [retention_count]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/backend/.env.production"
BACKUP_DIR="$ROOT_DIR/backups"
COMPOSE="docker compose -f $ROOT_DIR/docker-compose.prod.yml"
RETENTION="${1:-14}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found. Copy backend/.env.production.example and fill in real values first." >&2
  exit 1
fi

# shellcheck disable=SC1090
POSTGRES_USER=$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | tail -n1 | cut -d '=' -f2-)
POSTGRES_DB=$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | tail -n1 | cut -d '=' -f2-)

if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_DB" ]; then
  echo "ERROR: POSTGRES_USER / POSTGRES_DB not set in $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUT_FILE="$BACKUP_DIR/rentflow_${TIMESTAMP}.backup"

echo "Backing up database '$POSTGRES_DB' (user '$POSTGRES_USER') -> $OUT_FILE"
$COMPOSE exec -T postgres pg_dump -U "$POSTGRES_USER" -F c "$POSTGRES_DB" > "$OUT_FILE"

echo "Backup complete: $OUT_FILE ($(du -h "$OUT_FILE" | cut -f1))"

echo "Pruning backups older than the last $RETENTION..."
# shellcheck disable=SC2012
ls -1t "$BACKUP_DIR"/rentflow_*.backup 2>/dev/null | tail -n +$((RETENTION + 1)) | xargs -r rm -f --

echo "Done. Current backups:"
ls -lh "$BACKUP_DIR"/rentflow_*.backup 2>/dev/null || echo "(none)"
