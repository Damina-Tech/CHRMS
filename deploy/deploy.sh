#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/.."
command -v openssl >/dev/null
docker compose version >/dev/null
if [ ! -f .env ]; then
  umask 077
  {
    printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 32)"
    printf 'JWT_SECRET=%s\n' "$(openssl rand -hex 48)"
    printf 'ADMIN_PASSWORD=%s\n' "$(openssl rand -hex 24)"
    printf 'ADMIN_EMAIL=admin@chiro.gov.et\n'
  } > .env
fi
compose() {
  if [ "${DEPLOY_DOMAINS:-1}" = 1 ]; then
    docker compose --env-file .env -f docker-compose.yml -f docker-compose.domains.yml "$@"
  else
    docker compose --env-file .env "$@"
  fi
}
diagnostics() { compose ps || true; compose logs --tail 80 postgres chrms-api chrms-web || true; }
trap diagnostics ERR
compose config --quiet
compose build --pull
compose up -d --wait --wait-timeout 120 postgres
compose run --rm --no-deps chrms-api npx prisma migrate deploy
export ADMIN_EMAIL="$(sed -n 's/^ADMIN_EMAIL=//p' .env | tr -d '\r')"
export ADMIN_PASSWORD="$(sed -n 's/^ADMIN_PASSWORD=//p' .env | tr -d '\r')"
compose run --rm --no-deps -e ADMIN_EMAIL -e ADMIN_PASSWORD chrms-api node scripts/bootstrap-admin.cjs
unset ADMIN_EMAIL ADMIN_PASSWORD
compose up -d --wait --wait-timeout 180 --remove-orphans
compose exec -T chrms-api node -e "fetch('http://127.0.0.1:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
compose exec -T chrms-web wget -q -O /dev/null http://127.0.0.1/
if [ "${DEPLOY_DOMAINS:-1}" = 1 ]; then bash deploy/configure-domains.sh; fi
compose ps
