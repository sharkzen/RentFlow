#!/usr/bin/env bash
# Deploy RentFlow on the Ubuntu VPS.
# Usage: ./deploy.sh [--skip-backup]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

COMPOSE="docker compose -f docker-compose.prod.yml"
SKIP_BACKUP="${1:-}"

echo "==> Checking working tree is clean..."
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree has uncommitted changes. Commit or stash before deploying." >&2
  git status --short
  exit 1
fi

echo "==> Pulling latest code (fast-forward only)..."
git pull --ff-only

if [ "$SKIP_BACKUP" != "--skip-backup" ]; then
  echo "==> Backing up database before deploy..."
  ./scripts/backup.sh
else
  echo "==> Skipping pre-deploy backup (--skip-backup)"
fi

echo "==> Building images..."
$COMPOSE build

echo "==> Recreating services..."
$COMPOSE up -d --remove-orphans

echo "==> Waiting for services to become healthy..."
ATTEMPTS=0
MAX_ATTEMPTS=30
until [ "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}n/a{{end}}' rentflow-backend rentflow-frontend ocr-server rentflow-postgres rentflow-redis 2>/dev/null | grep -vc '^healthy$\|^n/a$')" = "0" ] || [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; do
  ATTEMPTS=$((ATTEMPTS + 1))
  sleep 2
done

if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
  echo "WARNING: not all services reported healthy within the timeout. Check status below." >&2
fi

echo "==> Current service status:"
$COMPOSE ps

echo "==> Deploy finished."
