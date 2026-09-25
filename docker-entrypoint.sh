#!/bin/sh
set -e

mkdir -p /data/db /data/templates

# `docker compose run --rm canalcik <cmd>` (e.g. `pnpm run fetch`) runs that
# instead of booting the server.
if [ "$#" -gt 0 ]; then
	exec "$@"
fi

# Some migrations here are hand-written and destructive (see
# prisma/migrations/*), so back up the db before migrate deploy touches it.
db_backups_to_keep=5
db_path="${DATABASE_URL#file:}"
if [ -f "$db_path" ]; then
	backup_dir="$(dirname "$db_path")/backups"
	mkdir -p "$backup_dir"
	backup_file="$backup_dir/$(basename "$db_path").$(date +%Y%m%d%H%M%S)"
	sqlite3 "$db_path" ".backup '$backup_file'"
	ls -t "$backup_dir"/"$(basename "$db_path")".* 2>/dev/null | tail -n +$((db_backups_to_keep + 1)) | xargs -r rm --
fi

pnpm exec prisma migrate deploy

# The SPA ships in the image; Caddy serves it from the host, so republish it
# into the bind mount on every start.
find /web -mindepth 1 -delete
cp -R frontend/dist/. /web/

exec pnpm --filter @canalcik/server start
