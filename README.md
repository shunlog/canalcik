# Canalcik

A web app made to facilitate the creation and management of documents 
for the Apa Canal Moldova company.

For a start, the website will provide forms for the creation of docx documents for 2 templates.
It will have lots of suggestions and defaults, to minimize input from the user.

We reverse-engineer the data model that the organization implicitly uses.
There are document templates (which mostly store facts/events), entities (vehicles, drivers), data sources (as spreadsheets).

The website will be used to:
1. Fill forms (with suggestions, reference validation) and generate documents from them
2. List and edit completed forms
3. Manage the company data

## Requirements

The website that will be used by a single user.
Needs to be accessible both from mobile phone and desktop.

The website will use HTTP basicauth, so only the user can access it.

Form completion:
- fields with suggestions
    - e.g. look-up value from data source based on key from another field
    - e.g. suggestions based on cross-reference between fields
- sane defaults (e.g. today's date)
- field type validation

Templates:
- Stored on Google Drive as `.odt` or sheets
- use `{{this_syntax}}` from docx-template for parameters
- the functions that fill the templates will assert that the placeholders and the given data form a bijection

### Data storage

The generated documents will be stored on the my Google Drive.
The app will have its own folder `canalcik`. 
It will need to generate the folder itself, so that it has access to it (that's how `drive.file` works).

Drive access is a user OAuth token in `token.json` at the repo root (override
the location with `TOKEN_PATH`).
Authorization happens once, from the
terminal: `pnpm run auth`

`drive.file` is the only scope requested. The folder is created on the first
`/api/drive/status` call, i.e. the first time the app is opened after
authorizing, which is also what makes it findable later. Two consequences:

Handling the templates is simpler.
They are also on my Drive, in any dir, shared with "anyone with the link".
Their URLs go in `.env`
(`TEMPLATE_URL_*`) and `pnpm run fetch`
saves them to `data/templates/`.
Set `GOOGLE_API_KEY` to export through the
Drive API (the key must not be restricted to HTTP referrers, or requests from
Node get a 403); left unset, the keyless `docs.google.com` export endpoint is
used.
`fetchTemplates()` in `templates/fetchTemplates.ts` is the reusable entry
point — the server can call it to refresh the templates on demand.


## Generated documents

The user creates the *comanda materiale* about 1/day,
and each such document is tied to 2-3 *act defectiune* documents.

- "Comanda de materiale"
- "Act de constatare a defectiunilor"
- "Fisa limita"
    - A sheet for each vehicle+driver combination, for each month

### Data sources

- "Categorii produse" (*categorii_produse*) - spreadsheet table:
    - column 1: Category (using MSWord hierarchy, 5 levels)
    - column 2: 
        - "Denumire produs": *material name*
        - "Cod produs": *material code*

- "Gestiune flota", tab "Vehicule" (*tabel_vehicule*) - spreadsheet table:
    - "Destinatia": *vehicle type*
    - "Marca/model": *vehicle model*
    - "Nr. inmatriculare": *registration nr*
    - "Nr. inventar": *inventory nr*
    - "Sofer": list of names, separated by "/"

- Gestiune flota, tab "Soferi":
    - Nume, prenume
    - Nr. de pontaj (e.g. 6832) *driver code*

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

# Existing solutions explored

- [Docassemble](https://docassemble.org/)
    - only asks one question at a time, but I want a form
    - doesn't have document management
- [Docupilot](https://www.docupilot.com/)
    - has a template editor that uses syntax `{{like_this}}`
    - don't see its document management capabilities
- Interactive PDF Form (AcroForm)
    - works in Firefox
    - doesn't seem to have features for external data sources or validation
