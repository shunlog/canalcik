# Deploy

Three trees under `/srv/canalcik`, and one rule that decides every permission:
**everything that writes to `data/` runs as `canalcik`, everything that writes
to `app/` or `web/` runs as the deploy user (`awh`).** No file is written by
both, so nothing ends up owned by the account that cannot rewrite it.

Caddy serves `web/` — a copy of `frontend/dist` — and proxies `/api` to the
Hono process on `127.0.0.1:8787`.

```
/srv/canalcik/
├── .env            awh:canalcik      640   secrets and prod paths
├── app/            awh:canalcik      750   the checkout, read-only to the service
├── web/            awh:awh           755   published frontend/dist
└── data/           canalcik:canalcik 750   everything the service writes
    ├── db/                                 prod.db + its -wal/-shm
    ├── templates/                          templates fetched from Drive
    ├── backups/                            pre-migration DB copies
    └── token.json                    600   OAuth token, rewritten on refresh
```

| path | owner | mode | why this mode |
| --- | --- | --- | --- |
| `/srv/canalcik` | `awh:awh` | 755 | you create `.env` here; `caddy` needs `o+x` to reach `web/` |
| `/srv/canalcik/.env` | `awh:canalcik` | 640 | you write it, the service and the CLI scripts read it |
| `/srv/canalcik/app` | `awh:canalcik` | 750 | deploys write, the service only reads |
| `/srv/canalcik/web` | `awh:awh` | 755 | `caddy` reads it as "other" — no group grant needed |
| `/srv/canalcik/data` | `canalcik:canalcik` | 750 | `awh` reads it through the group, nobody else sees it |
| `/srv/canalcik/data/db` | `canalcik:canalcik` | 750 | WAL needs *directory* write for `-wal`/`-shm` |
| `/srv/canalcik/data/token.json` | `canalcik:canalcik` | 600 | replaced by rename on refresh, so the dir must be canalcik's |

Four important decisions:

- **The checkout is not writable by the service**
- **The build is copied out of the checkout.** Caddy runs as `caddy`, so what
  it serves must be world-readable
- **`token.json` lives in `data/`, not next to `.env`.**, because `canalcik` needs
  access to it to be able to refresh it
- **The DB gets its own directory.** because SQLite creates some files near the DB

## One-time setup

The service account has no login shell and a home outside `/home`, which
`ProtectHome=yes` masks — pnpm and tsx still need a writable `$HOME`:

```sh
sudo useradd --system --create-home --home-dir /var/lib/canalcik \
     --shell /usr/sbin/nologin canalcik
sudo usermod -aG canalcik awh          # then re-login, or `newgrp canalcik`
getent passwd canalcik                 # home must not be under /home
```

Node and pnpm have to be installed system-wide for the same reason — a
`node` under `~/.nvm` is invisible to the unit and surfaces as `203/EXEC`:

```sh
which -a node pnpm                     # expect /usr/bin or /usr/local/bin
```

Lay out the tree. `data/` is created by hand: the unit has no
`StateDirectory=`, which only works under `/var/lib`.

```sh
sudo install -d -o awh      -g awh      -m 755 /srv/canalcik /srv/canalcik/web
sudo install -d -o canalcik -g canalcik -m 750 \
     /srv/canalcik/data /srv/canalcik/data/{db,templates,backups}
```

Clone as `awh`, then hand the group over:

```sh
git clone <repo> /srv/canalcik/app
chgrp -R canalcik /srv/canalcik/app
chmod 750 /srv/canalcik/app
```

`/srv/canalcik/.env` is `.env.example` with the prod paths. Create it with the
mode already tight, so it is never briefly world-readable:

```sh
install -m 640 -g canalcik /dev/null /srv/canalcik/.env
$EDITOR /srv/canalcik/.env
```

```sh
DATABASE_URL="file:/srv/canalcik/data/db/prod.db"
TEMPLATES_DIR=/srv/canalcik/data/templates
TOKEN_PATH=/srv/canalcik/data/token.json
```

Install and start the unit:

```sh
sudo install -o root -g root -m 644 \
  /srv/canalcik/app/deploy/canalcik.service /etc/systemd/system/canalcik.service
sudo systemctl daemon-reload && sudo systemctl enable --now canalcik
systemd-analyze security canalcik.service    # needs systemd >= 247
```

Then authorize Drive once. This must run **as `canalcik`** — run it as
yourself and `token.json` ends up owned by `awh`: startup still works, and the
failure arrives hours later at the first refresh, when the service tries to
replace a file it does not own. The CLI reads `.env` from the cwd, which prod
does not have, so source it explicitly:

```sh
sudo -u canalcik -H bash -c '
  set -a; . /srv/canalcik/.env; set +a
  cd /srv/canalcik/app && exec pnpm run auth'

ls -l /srv/canalcik/data/token.json     # canalcik canalcik, before going further
```

Build the frontend and publish it. The `--chmod` is what guarantees `caddy`
can read the result whatever your umask is:

```sh
cd /srv/canalcik/app
pnpm install --frozen-lockfile      # not --prod: tsx and prisma are dev deps
pnpm build
rsync -a --delete --chmod=D755,F644 frontend/dist/ /srv/canalcik/web/
```

`deploy/Caddyfile` is a complete site block. Install it root-owned:

```sh
sudo install -o root -g root -m 644 \
  /srv/canalcik/app/deploy/Caddyfile /etc/caddy/sites/canalcik.Caddyfile
```

In `/etc/caddy/Caddyfile`, so the other sites on the box stay:

```caddyfile
import /etc/caddy/sites/*.Caddyfile
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

`{$...}` expands in the environment of the running process, so after editing
that file use `systemctl restart caddy` — a reload keeps the old values.

Check the path as `caddy` rather than trusting that the modes look right; a
missing `+x` on a parent surfaces as a 403, not an error:

```sh
namei -l /srv/canalcik/web/index.html
sudo -u caddy test -r /srv/canalcik/web/index.html && echo ok || echo denied
```

Port 80 must be reachable from outside for the ACME challenge — forward 80 and
443 on the router, and nothing else. Port 8787 stays on loopback.

## Deploying a new commit

Everything that touches `data/` goes through the service account. Paste this
helper first — it drops privileges, loads the prod env, and runs from the
checkout:

```sh
asvc() {
  sudo -u canalcik -H bash -c '
    set -a; . /srv/canalcik/.env; set +a
    cd /srv/canalcik/app && exec "$@"' _ "$@"
}
```

```sh
cd /srv/canalcik/app
umask 022                             # keep new files group-readable to the service
git pull --ff-only
pnpm install --frozen-lockfile        # not --prod: tsx and prisma are dev deps
pnpm exec prisma generate             # as awh: it writes node_modules/

asvc sqlite3 /srv/canalcik/data/db/prod.db \
     ".backup /srv/canalcik/data/backups/$(date +%F-%H%M).db"
asvc pnpm exec prisma migrate deploy  # never `migrate dev` — it can reset the DB
asvc pnpm run fetch                   # (re)populates data/templates

pnpm build
rsync -a --delete --chmod=D755,F644 frontend/dist/ /srv/canalcik/web/
sudo systemctl restart canalcik
```

`prisma generate` is the one step that stays as `awh`, because it writes into
`node_modules/`. `migrate deploy`, the backup and `fetch` only touch `data/`,
so they run as the service — run `fetch` as yourself and the new templates are
`awh`-owned, and the server gets `EACCES` the next time it rewrites one.

The files in `deploy/` are copies, not symlinks — diff, re-install whichever
changed, and only then reload:

```sh
diff /srv/canalcik/app/deploy/canalcik.service /etc/systemd/system/canalcik.service
diff /srv/canalcik/app/deploy/Caddyfile /etc/caddy/sites/canalcik.Caddyfile
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
systemctl show canalcik -p Environment   # what the unit actually parsed from .env
ss -tlnp | grep 8787                 # should be 127.0.0.1:8787, not *:8787
curl -s localhost:8787/api/health    # bypasses Caddy and basicauth
sudo -u canalcik ls -l /srv/canalcik/data    # state, as the service sees it
```

What actually goes wrong, in rough order of frequency:

- **Drive auth works, then stops.** `token.json` was created by the wrong user.
  `ls -l` it; `sudo chown canalcik:canalcik` and re-run `pnpm run auth` as
  above.
- **`203/EXEC` on start.** `ProtectHome=yes` hides `/home`, so an nvm-installed
  node or a pnpm shim in a home directory does not exist as far as the unit is
  concerned. Install both system-wide.
- **`SQLITE_CANTOPEN` / `SQLITE_READONLY` on a file that exists.** Either
  `data/db` is not owned by `canalcik`, or `ReadWritePaths=` no longer covers
  it. Never put this directory on an NFS or SMB mount — SQLite locking is
  unreliable there.
- **403 from Caddy on the frontend.** `web/` or one of its parents lost `o+x`
  or `o+r`; that is what `--chmod=D755,F644` on the rsync prevents. Do not fix
  it by adding `caddy` to the `canalcik` group — that would give it `.env`.
- **The service cannot read its own code after a deploy.** A deploy run under a
  tight umask leaves the checkout's files `600`. `sudo chmod -R g+rX
  /srv/canalcik/app`, and keep the `umask 022` above.
- **`usermod -aG` has not taken effect.** It only applies to new sessions, so
  `ls /srv/canalcik/data` stays denied until you re-login.
