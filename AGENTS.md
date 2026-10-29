# AGENTS.md

This file provides guidance to coding agents (Claude Code, Codex, and others) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev               # all apps in parallel (Turbo)
pnpm dev:client        # client only
pnpm dev:server        # server only

# Build
pnpm build             # all packages + apps (Turbo, respects dependency order)

# Database (local Docker replica set, see "Local database")
pnpm db:up             # start MongoDB; dev, db:setup, db:reset and test:db run it first
pnpm db:generate       # regenerate the Prisma client after any schema change
pnpm db:seed           # DROPS the database, then seeds it: local only
pnpm db:sync           # upsert the catalogue onto DATABASE_URL: safe on production
pnpm db:setup          # up + push + generate + seed: a fresh clone's one command after install
pnpm db:reset          # the same with --force-reset: wipe dev data and start over

# Type-check
pnpm type-check        # tsc across every workspace via Turbo
pnpm types:watch       # watch mode across all TS projects

# Quality
pnpm lint
pnpm format
pnpm test          # every vitest suite via Turbo; no Docker needed
pnpm test:db       # server suite against the Docker database, left in place for Compass
pnpm test:e2e      # Playwright smoke suite against the built apps (see "End-to-end tests")
```

### Running a single workspace

```bash
pnpm --filter server run dev
pnpm --filter client run dev
```

## Architecture

**Turborepo + pnpm** monorepo with build dependency order enforced by Turbo:

```
packages/database  →  packages/domain  →  apps/server
                                       →  apps/client

packages/media                                            (leaf: assets + scripts, nothing imports it)
```

- **`apps/server`**: Express 5 REST API (TypeScript, Node ≥ 24.5)
- **`apps/client`**: React 19 + React Router v8 + Vite 8 + TailwindCSS 4
- **`apps/e2e`**: Playwright smoke suite (`pnpm test:e2e`); imports nothing from the monorepo and drives both apps over HTTP
- **`packages/database`**: Prisma client + multi-file schema (`prisma/schema/` by domain), MongoDB (Docker replica set locally, Atlas in production)
- **`packages/domain`**: Single source of truth for shared types, Zod schemas, DTOs, error codes
- **`packages/media`**: Catalogue image originals under `assets/`, plus the import / sync / check scripts for the R2 bucket behind `audiophile-media.t-bendet.com`. See its README.
- **`packages/config-eslint`** / **`packages/config-typescript`**: Shared configs

## Server Conventions

### Request lifecycle

```
Route → validateSchema middleware → Controller → Service → Prisma
```

- **`defineHandler(XRequestSchema, fn)`** — how every route that takes input is written. It returns the `[validateSchema(schema), catchAsync(fn)]` pair, the controller exports it as a `ValidatedHandler`, and the route spreads it (`router.post("/", ...controller.createX)`). The schema is named once, in the controller, and `req.verified` is inferred from it. Route files never import a request schema.
- **`catchAsync`** — wrap every async route handler; centralized error middleware handles the rest. Only for handlers whose route mounts no schema
- **`validateSchema(ZodSchema)`** — validates `params`, `body`, `query`; validated data lands in `req.verified`. Reached through `defineHandler`, not mounted by hand
- **`AppError`** — throw with error codes from `@repo/domain/error-codes`; never throw raw errors
- **Zod errors** — auto-converted to `AppError(422, VALIDATION_ERROR)` by error middleware
- **Logging** — `pino` + `pino-http`; inside a request use `req.log` (it carries `requestId`), never the bare `logger`. Errors are logged once, at the boundary: the error middleware puts the error on `res.err` and its severity on `res.errLogLevel` (`error` for our own failures - a non-operational `AppError` or a 5xx - `warn` for client faults) and pino-http emits the single line for that request. Layers in between throw, they don't log.

### Service layer

Extend `AbstractCrudService<Entity, CreateInput, UpdateInput, DTO>` (4 type params) and implement:
`toDTO`, `persistFindMany`, `persistFindById`, `persistCreate`, `persistUpdate`, `persistDelete`.

All query building (where, select, orderBy) belongs inside `persistFindMany` via private helpers — it is **not** abstracted by the base class.

Skip the service layer for simple pass-through CRUD; go controller → Prisma directly.

### Tests

Server route tests run against the real Express `app` through supertest. A vitest `globalSetup`
boots an in-memory MongoDB replica set (Prisma requires one), pushes the schema for its indexes,
and hands the URL to `test/helpers/setup.ts`, which sets `DATABASE_URL` before `app` is imported.
Seed with the fixture builders in `test/helpers/database.ts` and call `resetDatabase` around each
test; protected routes take a real signed JWT via `authCookie(userId)`. Files share one database,
so `fileParallelism` is off. The mongod binary is fetched once by `pnpm install` and cached
globally; `global-setup.ts` pins the version it runs.

Setting `TEST_DATABASE_URL` skips the in-memory boot and runs the server suite against that
database instead (schema pushed, nothing torn down), so a failed run can be inspected in Compass
afterwards. `pnpm test:db` does this against the Docker database, using its own database name,
`audiophile-test`. Never point it at `audiophile`: `resetDatabase` truncates every collection it
knows about. The switch is keyed on
`TEST_DATABASE_URL` only; `DATABASE_URL` is ignored by the test setup, which is what keeps a local
`.env` and the `DATABASE_URL` CI sets from redirecting a run. In-memory stays the default, so
`pnpm test` on a fresh clone and in CI needs no Docker.

A random server test failing locally with a status nothing in this repo returns - `405` above all -
is a squatter, not a bug in your change. `wrangler dev` can outlive the shell that started it, and
the `workerd` it leaves behind holds ephemeral-range ports and answers `405` to any method on any
path; supertest binds a fresh ephemeral port per request, so one occasionally lands there instead of
on the app. Find it with `lsof -nP -iTCP -sTCP:LISTEN | grep -i workerd`, kill it, and re-run before
diagnosing anything else. CI never sees this.

### Validation rules

- Use `.strict()` on all Zod input schemas (rejects unknown fields)
- Controllers do **not** re-validate structure (middleware already did it)
- 5-layer system: route middleware → controller logic → Prisma extensions → DB constraints → DTO mapping

### Code comments

Default to no comments — names and structure should carry the meaning; rationale belongs in `docs/adr/`, not inline.

Add one only when:

- an existing convention already comments every item in a section (e.g. the numbered middleware steps in `app.ts` — match the existing one-line style), or
- a genuinely non-obvious constraint needs flagging (a hidden invariant, a workaround, something a reader would get wrong without it).

Even then: one short line. No rationale paragraphs, no restating what the code already shows.

### Domain package naming

| Suffix                          | Purpose                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| `*CreateInput` / `*UpdateInput` | write operations                                            |
| `*DTO`                          | read responses                                              |
| `*WhereInput`                   | filter params                                               |
| `*Select`                       | field selection                                             |
| `ExtendedQueryParams`           | pagination/sorting                                          |
| `*QueryParams`                  | one entity's list query: `ExtendedQueryParams<{ filters }>` |

All exports flow through `packages/domain/src/index.ts`.

## Client Conventions

### Data fetching

TanStack Query v5 is used for all server state. Define query options as factories:

```typescript
export const getProductByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["products", id],
    queryFn: () => getApi().then((api) => api.get(`/products/${id}`)),
    staleTime: 60_000,
  });
```

Retry policy (`apps/client/src/lib/react-query.ts`): 4xx → no retry; 5xx / network → retry ×2 with backoff.

### HTTP client

All requests go through `getApi()` (lazy Axios init with interceptors). Errors are auto-classified to `AppError` with semantic `ErrorCode` values. 4xx errors surface inline in UI; 5xx / network errors show toast notifications.

### React Router v8 middleware

Used for dev-only navigation timing — the client's one middleware, `apps/client/src/app/middleware/performance.ts`. Middleware chain runs parent→child going down, child→parent coming up. `next()` never throws — errors before `next()` bubble to the highest route with a loader; errors after `next()` bubble from the throwing route.

## End-to-end tests

`pnpm test:e2e` runs the Playwright smoke suite in `apps/e2e` against the built apps on its own
ports (`8001`, `4173`) and its own database (`audiophile-e2e`), so a `pnpm dev` session is neither
tested nor disturbed. The server under test runs with `NODE_ENV=test`, which stands the rate
limiters down; the vitest suite owns that behaviour. Specs import `test` and `expect` from
`tests/fixtures.ts` and nothing else from the monorepo. Before writing or fixing a spec, or when a
run fails on `E11000 ... Cart_userId_key`, read `apps/e2e/README.md`: fixtures, locator policy,
the seed-before-push order, what the suite covers, the CI job.

## Critical Pitfalls

1. **Regenerate with `pnpm db:generate` after any schema change** — the `prisma-client` generator is configured with `importFileExtension = "js"` (plus `runtime = "nodejs"`, `moduleFormat = "esm"`), so generated imports carry `.js` natively. No post-processing step is involved any more.
2. **Every async route handler must use `catchAsync`** — uncaught promise rejections won't reach the centralized error middleware otherwise. `defineHandler` does this for you.
3. **Every route accepting input must go through `defineHandler`** — never mount `validateSchema` by hand, and never skip it.
4. **Build order matters**: if types are missing, ensure `packages/database` and `packages/domain` are built before `apps/server`.

## Seeding vs syncing

`pnpm db:seed` drops the database and recreates everything: local only, never against Atlas.
`pnpm db:sync` upserts the catalogue the repo owns onto whatever `DATABASE_URL` names, touching no
user, cart or order; it is the migration step after a schema shape change, and CI runs it after
every deploy. Before running either against anything but the local database, or when changing
what the seed writes, read "Seeding vs syncing" in `packages/database/README.md`.

## Node version

`.nvmrc` and `apps/server/Dockerfile` name the major; raise them together.
`.github/scripts/assert-node-version.sh` fails every CI job if they drift. The `engines.node`
floor in the root `package.json` is deliberately open and moves only when something needs a newer
runtime (#240).

## Local database

One MongoDB in `docker-compose.yml`, a single-node replica set on `localhost:27017`, serves dev,
seeding, `test:db`, `test:e2e` and Compass; Prisma needs a replica set because nested writes run in
transactions. `pnpm db:up` starts it with `--wait`, and every script that needs it runs that first.
`pnpm test` and CI never start it.

```
dev     -> mongodb://localhost:27017/audiophile?replicaSet=rs0&directConnection=true
tests   -> mongodb://localhost:27017/audiophile-test?replicaSet=rs0&directConnection=true   (TEST_DATABASE_URL)
e2e     -> mongodb://localhost:27017/audiophile-e2e?replicaSet=rs0&directConnection=true    (pnpm test:e2e)
Compass -> mongodb://localhost:27017
```

Port 27017 has to be free, so a Homebrew `mongodb-community` service must be stopped first. No local
run touches Atlas. Before bumping the MongoDB version, which is pinned in two places, read
`docs/adr/0004-local-mongodb-is-a-docker-replica-set-on-8-2.md`.

## Environment Variables

Local development uses one `.env` per workspace, each copied from the committed `.env.example`
beside it, which documents every variable: `packages/database`, `apps/server`, `apps/client`,
`packages/media`. Production has no `.env` file at all; see "Deployment".

`MEDIA_BASE_URL` is required in every environment: `apps/server/src/utils/media.ts` joins it to a
stored image key at the API boundary, and nothing below it ever sees a URL.

`NODE_ENV` controls error verbosity: `development` returns full stack traces; `production`
sanitizes responses; `test` is set by the vitest configs and behaves like `production`. `LOG_LEVEL`
is optional and defaults per environment: `debug`, `info`, `silent`.

## Deployment

One Cloudflare Worker (`apps/server/wrangler.jsonc`) serves `audiophile.t-bendet.com`: `/api/*` to
the Express server in a Cloudflare Container, everything else as static assets; images from R2,
database on Atlas. The server's environment comes from the Worker: `vars` in `wrangler.jsonc` for
the plain values, Worker secrets for `DATABASE_URL` and `JWT_SECRET`. A push to `main` deploys
through `.github/workflows/ci.yml`, then syncs the catalogue. There are no pull-request previews;
check a branch with `pnpm --filter server exec wrangler dev`, which needs Docker. Before deploying
by hand, changing a secret or `var`, or touching the workflow, read "Deployment" in `README.md`;
the decision is `docs/adr/0005-audiophile-runs-on-cloudflare-under-t-bendet-com.md`.

## Git workflow

Every ticket gets its own branch, named `<type>/<issue#>-<slug>` (e.g. `fix/98-id-validator-uncalled`),
branched off `main` and PR'd back into `main`. Never commit ticket work directly to `main`; the legacy
`dev` branch is retired. Full rules in `docs/agents/issue-tracker.md`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `t-bendet/audiophile-ecommerce-v5`, managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label named after its role. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `docs/adr/` at the repo root, and `GLOSSARY.md` once one exists. See `docs/agents/domain.md`.

### Playwright agents

The planner, generator and healer in `.claude/agents/`, the `playwright-trace` skill and the
`playwright-test` MCP server in `.mcp.json` all belong to the E2E suite. Both initialisers overwrite
silently; what to re-apply after regenerating is in `apps/e2e/README.md`.
