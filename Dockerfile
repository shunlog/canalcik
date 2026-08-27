# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
# openssl: prisma's query engine links against it.
# sqlite3: backups and poking at the DB through `docker compose run`.
RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl sqlite3 ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN corepack enable pnpm
WORKDIR /app

# --- dependencies -----------------------------------------------------------
# Manifests only, so this layer survives every source-only change.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/
COPY frontend/package.json frontend/
RUN --mount=type=cache,target=/pnpm-store \
    pnpm install --frozen-lockfile --store-dir /pnpm-store

# --- build ------------------------------------------------------------------
FROM deps AS build
COPY . .
RUN pnpm exec prisma generate && pnpm build

# --- runtime ----------------------------------------------------------------
FROM base AS runtime
# Fixed uid: the host bind mount then has exactly one owner to chown, instead of
# a user, a group and a umask to keep in step.
RUN useradd --system --uid 10001 --no-create-home --shell /usr/sbin/nologin canalcik

# Everything stays root-owned and the process runs as 10001, so the code is
# read-only to the app for free — no chmod dance on the host.
COPY --from=build /app /app

# devDependencies ship deliberately: the server runs through tsx and the deploy
# steps use the prisma CLI, both of which are dev deps.
ENV PATH=/app/node_modules/.bin:$PATH
# tsx caches transforms under $TMPDIR; compose mounts a tmpfs there.
ENV HOME=/tmp

USER 10001:10001
EXPOSE 8787
CMD ["tsx", "server/src/index.ts"]
