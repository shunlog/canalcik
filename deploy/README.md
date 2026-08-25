# Deploy

Repo lives at `/srv/canalcik`, owned by the `canalcik` user. Caddy serves
`frontend/dist` and proxies `/api` to the Hono process on `127.0.0.1:8787`.

## One-time setup

Copy the gitignored files by hand — `.env`, `token.json`, `drive-config.json`.

In `.env`, point `DATABASE_URL` at `file:/srv/canalcik/data/prod.db` and
`TEMPLATES_DIR` at `/srv/canalcik/data/templates`. Both must be absolute paths.

```sh
sudo install -o root -g root -m 644 \
  /srv/canalcik/deploy/canalcik.service /etc/systemd/system/canalcik.service
sudo systemctl daemon-reload && sudo systemctl enable --now canalcik
```

`deploy/Caddyfile` is a complete site block. Install it root-owned:

```sh
sudo install -o root -g root -m 644 \
  /srv/canalcik/deploy/Caddyfile /etc/caddy/sites/canalcik.Caddyfile
```

In `/etc/caddy/Caddyfile`, so the other sites on the box stay:

```caddyfile
import /etc/caddy/sites/*.Caddyfile
```

Caddy runs as user `caddy`, so it needs read+traverse on `frontend/dist`; a missing
`+x` on a parent dir surfaces as a 403, not an error. The checkout is owned by
`canalcik`, so `caddy` needs `+x` on each parent to reach `dist` at all — that is a
separate grant from the recursive one, and skipping it is the usual cause of a 403
on a site that otherwise validates.

```sh
sudo setfacl -Rm u:caddy:rX /srv/canalcik/frontend/dist
sudo setfacl -m u:caddy:x /srv/canalcik /srv/canalcik/frontend
```

The second command is deliberately non-recursive and `x`-only: `caddy` can traverse
those two dirs but not list them, so `.env`, `token.json`, and `data/` stay unreadable.

Check it as `caddy` rather than trusting the exit status of `setfacl`:

```sh
namei -l /srv/canalcik/frontend/dist/index.html   # look for a parent missing x
sudo -u caddy test -r /srv/canalcik/frontend/dist/index.html && echo ok || echo denied
```

Caddy reads two placeholders from `/etc/caddy/canalcik.env` (mode 600, not in
git). Generate the hash with `caddy hash-password`:

```
CANALCIK_DOMAIN=canalcik.example.com   # any sub-subdomain works on DuckDNS
CANALCIK_BASICAUTH_USERNAME=example
CANALCIK_BASICAUTH_HASH=$2a$14$...
```

These are read by the whole Caddy process, not just this site. Load them via a
drop-in — `/etc/systemd/system/caddy.service.d/canalcik.conf`:

```ini
[Service]
EnvironmentFile=/etc/caddy/canalcik.env
```

`{$...}` expands in the environment of the running process, so after editing this
file use `systemctl restart caddy` — a reload keeps the old values.

## Deploying a new commit

```sh
cd /srv/canalcik
git pull --ff-only
pnpm install --frozen-lockfile      # not --prod: tsx and prisma are dev deps
sqlite3 data/prod.db ".backup data/backups/$(date +%F-%H%M).db"
pnpm exec prisma generate
pnpm exec prisma migrate deploy     # never `migrate dev` — it can reset the DB
pnpm run fetch                      # (re)populates data/templates/, gitignored
pnpm build
sudo systemctl restart canalcik
```

The files in `deploy/` are copies, not symlinks — diff, re-install whichever
changed, and only then reload:

```sh
diff /srv/canalcik/deploy/canalcik.service /etc/systemd/system/canalcik.service
diff /srv/canalcik/deploy/Caddyfile /etc/caddy/sites/canalcik.Caddyfile
```

`validate` needs the placeholders, which `sudo` does not inherit from the drop-in:

```sh
sudo bash -c 'set -a; . /etc/caddy/canalcik.env; set +a
  caddy validate --config /etc/caddy/Caddyfile' && sudo systemctl reload caddy
```

## Debugging

```sh
journalctl -u canalcik -f            # live tail
journalctl -u canalcik -p err        # errors only
ss -tlnp | grep 8787                 # should be 127.0.0.1:8787, not *:8787
curl -s localhost:8787/api/health    # bypasses Caddy and basicauth
```
