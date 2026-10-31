#!/bin/sh
set -e
mkdir -p /app/uploads/agreements
if [ "$(id -u)" = "0" ]; then
  chown -R node:node /app/uploads
  if command -v gosu >/dev/null 2>&1; then
    exec gosu node "$@"
  fi
  exec runuser -u node -- "$@"
fi
exec "$@"
