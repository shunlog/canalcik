# Canalcik

A web app made to facilitate the management management of information
and the filling out of documents for the Moldovan State-Owned Enterprise "Apa Canal".
The app is used by the sole person employed to do this in the company.

This person deals with keeping track information about:
- vehicles
- drivers (equipment expiration date)
- repair jobs (a few times a day)
- orders of materials (a few times a day)
- monthly bills reconciliation

At its core, the website facilitates filling out docx and xlsx documents
by letting the user input the data in responsive web forms with a fuzzy search feature,
saving the data in an SQLite DB,
and generating the documents automatically from the data.

We reverse-engineered the data model that the organization implicitly uses
from the documents that need to be filled out.

## Requirements

The website will be used by a single user.
It needs to be accessible both from both mobile and desktop.
It will use HTTP Basic Authentication.

The form fields will provide fuzzy search capabilities 
and will narrow down the possibilities based on related form inputs whenever possible.

The documents are generated using the `docxtemplater` and `xlsx-template` libraries
which take template documents with placeholders and fill them with the given data.

I wrote wrappers around the two libraries which assert that:
1. All of the placeholders are present in the given data
2. All of the given data maps to the existing placeholders, nothing will be skipped

I also wrote a data structure and a function for each template to make use of static checking.

## Data storage

The templates are stored in an arbitrary folder on my Google Drive (`/canalcik-templates`),
shared to "anyone with the link".
The app needs to be configured with a link to each template file.

The generated documents are saved in a specific folder on my Google Drive
whose name is configure (`/canalcik`).
The folder must be created by the app, not the user,
so that the app can access it (that's how the `drive.file` scope works).

Drive access is a user OAuth token in `token.json` at a configured location.
Authorization happens once by running `pnpm run auth` and confirming it in the browser.


# Development

## Running the app

The repo is a pnpm workspace with three packages: the root (Prisma schema, CSV
importers, document rendering), `server/` (REST API) and `frontend/` (web UI).

```sh
pnpm install
pnpm exec prisma generate   # only after changing prisma/schema.prisma
pnpm dev                    # API on :8787 and the UI on :5173, in parallel
```

`pnpm dev:server` and `pnpm dev:web` run the two halves separately when the
interleaved logs get in the way. Open <http://localhost:5173>; Vite proxies
`/api` to the server, so the browser only ever talks to one origin and there is
no CORS involved.

- **`server/`** — Hono on `@hono/node-server`, one router per entity under
  `server/src/routes/`, zod request schemas under `server/src/schemas/`, and a
  single `app.onError` that turns `ApiError`, `ZodError` and Prisma error codes
  into `{ error: { code, message, fields? } }`. The wire contract lives in
  `server/src/api-types.ts`; the zod schemas are pinned to it by compile-time
  equality checks, so the two cannot drift.
  `@prisma/client` is deliberately *not* a dependency of this package — see the
  comment in `server/src/db.ts`.
- **`frontend/`** — Vite + React + Mantine, with react-query for all fetching
  (no router loaders). Full CRUD for Sofer, Vehicul, BonEliberare,
  FacturaExpeditie and MaterialeIntretinere; the Sofer↔Vehicul many-to-many is
  editable from either side, and the material lines of a bon or a factura are
  edited inline on its page and replaced wholesale on save.

Calendar dates (`Sofer.eip*`, `BonEliberare.data`, `FacturaExpeditie.data`) are
`"YYYY-MM-DD"` strings end to end — Mantine 8's `DateInput` uses the same string
format, so no `Date` object is ever constructed. `main.tsx` registers dayjs's
`customParseFormat` plugin, without which typed dates are silently misparsed.

## To Do

- Implement referential integrity. In doc *act defectiune*, there are two table fields that reference rows in another table by their index. Make it so once the user referenced a row, the reference is kept correctly (stay correct when rows get re-ordered, block deleting, warning on stale references)
- Right now, there when rendering docx, there is error checking so there are no missing placeholder values, but there is no error checking for missing placeholders in the template itself


# Deploy

One container: the Hono API + SQLite. The host's Caddy serves the built SPA and
proxies `/api/*` to it, so nothing but loopback:8787 is exposed.

On the server, in the checkout (assumed `/srv/canalcik`):

- `.env` — from `.env.example`, with the real Google credentials and template
  URLs. `HOST`, `PORT`, `DATABASE_URL`, `TEMPLATES_DIR` and `TOKEN_PATH` are
  overridden by compose, so whatever they hold is ignored.
- `deploy/data/` — bind-mounted at `/data`: `db/prod.db`, `templates/`, `token.json`.
- `deploy/www/` — bind-mounted at `/web`, Caddy's root.

```sh
docker compose up -d --build
```

The entrypoint runs `prisma migrate deploy` and republishes `frontend/dist`
into `deploy/www/` on every start.

The container runs unprivileged as `APP_UID`:`APP_GID` from `.env` (`id -u`,
`id -g`). Point them at your own user and the bind mounts need no `chown` — the
db and `token.json` stay yours to edit. The SPA lands 644 in 755 dirs, so Caddy
reads it as its own user.

Drive authorization can't run on the server — the OAuth callback wants a browser
on `localhost:53682` — so do it on the laptop and carry the token over:

```sh
pnpm run auth
scp token.json server:/srv/canalcik/deploy/data/token.json
ssh server 'cd /srv/canalcik && docker compose run --rm canalcik pnpm run fetch'
```

Caddy: copy the block from `Caddyfile.example` into the main Caddyfile, fill in
the domain and a `caddy hash-password` hash, then reload. It is not imported from
here on purpose — the hash would end up in git, and a missing imported file makes
Caddy reject its whole config.

## redeploy updates

```sh
git pull && docker compose up -d --build
```

Frontend changes need the rebuild too — `dist` ships in the image. Templates
changed on Drive need no rebuild:

```sh
docker compose run --rm canalcik pnpm run fetch
```
