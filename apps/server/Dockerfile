# syntax=docker/dockerfile:1
# Build from the repo root: `docker build -f apps/server/Dockerfile .`
FROM node:24-bookworm-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    TURBO_TELEMETRY_DISABLED=1 \
    PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
# Prisma's engine picks its binary target from the system openssl.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable
WORKDIR /app

FROM base AS pruner
RUN npm install -g turbo@^2.10
COPY . .
RUN turbo prune server --docker

FROM base AS builder
# prisma.config.ts refuses to load without it; nothing here connects.
ENV DATABASE_URL=mongodb://localhost:27017/audiophile
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=server...

FROM base AS runner
ENV NODE_ENV=production \
    PORT=8000
COPY --from=pruner /app/out/json/ .
# `server...` would also install the lint and tsconfig packages' deps; bcrypt needs no scripts, it ships prebuilt.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile --ignore-scripts \
      --filter server --filter @repo/database --filter @repo/domain
COPY --from=builder /app/packages/domain/dist ./packages/domain/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
# The generated client records this absolute path and loads its engine from it.
COPY --from=builder /app/packages/database/generated ./packages/database/generated
COPY --from=builder /app/apps/server/dist ./apps/server/dist
USER node
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/server/dist/index.js"]
