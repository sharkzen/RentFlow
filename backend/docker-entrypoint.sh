#!/bin/sh
set -e
npx prisma generate
npx prisma db push --skip-generate

case "$*" in
  *worker*) ;;
  *)
    if [ -f src/init.ts ]; then
      npx ts-node --transpile-only -r tsconfig-paths/register src/init.ts
    else
      node dist/init.js
    fi
    ;;
esac

exec "$@"
