#!/usr/bin/env bash
# Force-reset the local dev Postgres database (docker-compose.yml) and reseed default data.
# Usage: ./scripts/reset-db.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE="docker compose -f $ROOT_DIR/docker-compose.yml"

echo "Resetting schema and reseeding default data..."
$COMPOSE exec backend npx prisma db push --force-reset
$COMPOSE exec backend npx ts-node -r tsconfig-paths/register src/init.ts

echo "Restarting backend and worker so they pick up the fresh schema/client..."
$COMPOSE restart backend worker

echo "Done."
