#!/bin/sh
set -e

mkdir -p /data/db /data/templates

# `docker compose run --rm canalcik <cmd>` (e.g. `pnpm run fetch`) runs that
# instead of booting the server.
if [ "$#" -gt 0 ]; then
	exec "$@"
fi

pnpm exec prisma migrate deploy

# The SPA ships in the image; Caddy serves it from the host, so republish it
# into the bind mount on every start.
find /web -mindepth 1 -delete
cp -R frontend/dist/. /web/

exec pnpm --filter @canalcik/server start
