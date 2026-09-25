# syntax=docker/dockerfile:1
FROM node:24-slim

# openssl: required by the Prisma query engine. 
# sqlite3: needed for db backups in docker-entrypoint.sh
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# PUPPETEER_SKIP_DOWNLOAD: @mermaid-js/mermaid-cli would otherwise pull a whole
# Chromium, and the ERD generator it backs is disabled by DISABLE_ERD anyway.
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    PUPPETEER_SKIP_DOWNLOAD=1 \
    DISABLE_ERD=true
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/
COPY frontend/package.json frontend/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

COPY prisma prisma/
RUN pnpm exec prisma generate

COPY . .
RUN pnpm build

COPY docker-entrypoint.sh /usr/local/bin/

# The two mount points. `node` is uid 1000 in the base image; compose overrides
# the runtime uid to match the host user, so this is only the default for a bare
# `docker run`.
RUN mkdir -p /data /web && chown node:node /data /web
USER node

EXPOSE 8787
HEALTHCHECK --interval=30s --start-period=15s \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
ENTRYPOINT ["docker-entrypoint.sh"]
