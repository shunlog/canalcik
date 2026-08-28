FROM node:24-slim

# openssl: required by the Prisma query engine.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
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
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec prisma generate && pnpm build

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
