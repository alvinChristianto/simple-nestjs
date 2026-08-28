#!/bin/sh
# Guards against accidentally running destructive Prisma commands against a
# production database. Loaded as a wrapper from guarded npm scripts.
#
# A command is considered DESTRUCTIVE if it can modify the database schema,
# reset, or wipe data (e.g. prisma migrate reset, prisma db push --force-reset,
# prisma migrate dev which can reset if drift is detected).
#
# Policy:
#   - Always blocked when APP_ENV or NODE_ENV is "production".
#   - Otherwise requires an explicit opt-in flag, PRISMA_ALLOW_DESTRUCTIVE=1,
#     set in the environment ONLY when you intend to run it against a throwaway
#     or development database.
#   - The flag is never set automatically by this script.

set -eu

env_name="${APP_ENV:-${NODE_ENV:-development}}"
if [ "$env_name" = "production" ]; then
  echo "ABORT: refusing to run '$*' with APP_ENV/NODE_ENV=production." >&2
  echo "       Destructive Prisma commands are not allowed in production." >&2
  exit 1
fi

if [ "${PRISMA_ALLOW_DESTRUCTIVE:-0}" != "1" ]; then
  echo "ABORT: '$*' is a DESTRUCTIVE database command." >&2
  echo "" >&2
  echo "This command can modify the schema or erase data. To run it, you must" >&2
  echo "explicitly opt in by setting the flag (e.g. against a dev DB only):" >&2
  echo "" >&2
  echo "  PRISMA_ALLOW_DESTRUCTIVE=1 npm run <script>" >&2
  echo "" >&2
  echo "Never run this against production data." >&2
  exit 1
fi

exec "$@"
