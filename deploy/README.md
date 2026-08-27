# Deploy

The app ships as an image. The host keeps only what the image must not carry:
the secrets, the mutable state, and the built SPA. Caddy stays on the host —
it serves the other sites on this box — and proxies `/api` to the container on
`127.0.0.1:8787`.

`Dockerfile` and `compose.yaml` live at the repo root, so `docker compose`
finds them with no `-f`. Only `Caddyfile` here gets installed onto the host.

**Do not add your user to the `docker` group.** Membership is root-equivalent —
a container can bind-mount `/` — so it would undo the point of running the app
unprivileged. Every command below is `sudo docker compose`.

## Layout

| path | owner | mode | holds |
| --- | --- | --- | --- |
| `/srv/canalcik/app` | `awh:awh` | 755 | the checkout; only ever used as build context |
| `/srv/canalcik/.env` | `awh:awh` | 600 | secrets and paths, read by compose as root |
| `/srv/canalcik/data` | `10001:10001` | 750 | bind-mounted at `/data` — `db/`, `templates/`, `backups/`, `token.json` |
| `/srv/canalcik/web` | `10001:10001` | 755 | SPA copied out of the image; `caddy` reads it as "other" |

The checkout needs no special permissions any more: the code the service runs
lives in the image, root-owned, and the process runs as uid 10001, so it is
read-only to the app without a single `chmod`. `10001` is a fixed uid baked
into the image precisely so the bind mount has exactly one owner to chown,
instead of a user, a group and a umask to keep in step.

Inside the container the sandbox is `read_only: true` with a tmpfs on `/tmp`,
`cap_drop: ALL`, and `no-new-privileges` — so `/data` is the only path the app
can write, the same guarantee `ProtectSystem=strict` used to give.

## One-time setup

```sh
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker      # `restart: unless-stopped` needs this
```

A host account sharing the image's uid, so `ls -l` shows a name rather than a
bare `10001`. It has no login and owns nothing but the state:

```sh
sudo useradd --system --uid 10001 --no-create-home \
     --shell /usr/sbin/nologin canalcik

sudo install -d -o awh      -g awh      -m 755 /srv/canalcik
sudo install -d -o canalcik -g canalcik -m 755 /srv/canalcik/web
sudo install -d -o canalcik -g canalcik -m 750 \
     /srv/canalcik/data /srv/canalcik/data/{db,templates,backups}

git clone <repo> /srv/canalcik/app
```

`/srv/canalcik/.env` is `.env.example` with the paths as the *container* sees
them:

```sh
install -m 600 /dev/null /srv/canalcik/.env
$EDITOR /srv/canalcik/.env
```

```sh
DATABASE_URL=file:/data/db/prod.db
TEMPLATES_DIR=/data/templates
TOKEN_PATH=/data/token.json
PORT=8787
# Required in prod, and only safe because compose publishes the port as
# 127.0.0.1:8787. Docker forwards to the container's eth0, so a process bound
# to the container's loopback is unreachable — caddy would get ECONNREFUSED.
HOST=0.0.0.0
```

Compose does not run a shell over this file: no `export`, no `${VAR}`, and
leave the values unquoted — the quotes in `.env.example` are for dotenv in dev.

Build and start:

```sh
cd /srv/canalcik/app
sudo docker compose build
sudo docker compose up -d
sudo docker compose ps
```

Publish the SPA out of the image onto the path caddy serves:

```sh
sudo docker compose run --rm publish
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

Forward 80 and 443 on the router and nothing else; 8787 never leaves the host.

### Authorizing Drive

`scripts/auth.ts` listens on 53682 for Google's redirect, 
so that port has to be published for
the one-off run — and since the browser is on your laptop, forwarded there too:

```sh
# on your laptop
ssh -L 53682:localhost:53682 awh@server

# in that session, on the server
cd /srv/canalcik/app
sudo docker compose run --rm -p 127.0.0.1:53682:53682 app tsx scripts/auth.ts

ls -ln /srv/canalcik/data/token.json     # 10001 10001
```

`http://localhost:53682/oauth2callback` must be an authorized redirect URI on
the OAuth client in the Google Cloud console.

## Deploying a new commit

```sh
cd /srv/canalcik/app
git pull --ff-only

sudo docker tag canalcik:latest canalcik:prev    # cheap rollback
sudo docker compose build

sudo docker compose run --rm app \
  sqlite3 /data/db/prod.db ".backup /data/backups/$(date +%F-%H%M).db"
sudo docker compose run --rm app prisma migrate deploy   # never `migrate dev`
sudo docker compose run --rm app tsx scripts/fetchTemplates.ts

sudo docker compose up -d
sudo docker compose run --rm publish
```

Every `run --rm` uses the image just built, with the same user, sandbox and
env_file as the server — so a migration or a fetch cannot write state as the
wrong owner. That is the whole reason `x-canalcik` is a shared anchor in
`compose.yaml` rather than settings on `app` alone.

To roll back: `sudo docker tag canalcik:prev canalcik:latest && sudo docker
compose up -d`. Migrations are not reversed by that — restore from
`/srv/canalcik/data/backups/` if the schema moved.

`Caddyfile` is a copy, not a symlink — diff, re-install if it changed, and only
then reload. `validate` needs the placeholders, which `sudo` does not inherit
from the drop-in:

```sh
diff /srv/canalcik/app/deploy/Caddyfile /etc/caddy/sites/canalcik.Caddyfile
sudo bash -c 'set -a; . /etc/caddy/canalcik.env; set +a
  caddy validate --config /etc/caddy/Caddyfile' && sudo systemctl reload caddy
```

## Debugging

```sh
sudo docker compose logs -f app
sudo docker compose ps                 # health column, not just "running"
sudo docker compose exec app sh        # poke around; rootfs is read-only
ss -tlnp | grep 8787                   # 127.0.0.1:8787 only, never *:8787
curl -s localhost:8787/api/health      # bypasses caddy and basicauth
ls -ln /srv/canalcik/data              # every entry should be 10001 10001
```

What actually goes wrong:

- **Caddy gets `ECONNREFUSED` on `/api`.** `HOST` is unset or `127.0.0.1`, so
  the server bound the container's loopback and the published port forwards to
  eth0. It must be `HOST=0.0.0.0`; the exposure is controlled by the
  `127.0.0.1:` prefix in `ports:`, not by the bind address.
- **The API answers from another machine.** Something dropped that prefix.
  Docker inserts its own iptables rules ahead of ufw, so `"8787:8787"` is
  world-reachable even with ufw denying the port — ufw is not a backstop here.
- **`EACCES` under `/data`.** The bind mount is not owned by 10001. `sudo chown
  -R 10001:10001 /srv/canalcik/data`. Anything written from the host — a
  `sudo sqlite3` run outside the container, an `rsync` — reintroduces this.
- **`EROFS` somewhere unexpected.** `read_only: true` means only `/data` and
  the `/tmp` tmpfs are writable. That is the intended failure, not a bug to
  work around by dropping the flag.
- **403 from Caddy on the frontend.** `/srv/canalcik/web` or a parent lost
  `o+x`/`o+r`; the `publish` service ends with `chmod -R a+rX /web` for exactly
  this. Do not fix it by giving `caddy` group access to `/srv/canalcik`.
- **Nothing comes back after a reboot.** `restart: unless-stopped` only fires
  if `docker.service` itself is enabled.
- **Values arriving with quotes attached.** Unquote them in
  `/srv/canalcik/.env`; `systemctl show`-style debugging has no equivalent here,
  so check with `sudo docker compose run --rm app env | sort`.
