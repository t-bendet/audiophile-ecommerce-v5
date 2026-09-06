# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev               # all apps in parallel (Turbo)
pnpm dev:client        # client only
pnpm dev:server        # server only

# Build
pnpm build             # all packages + apps (Turbo, respects dependency order)

# Database (local Docker replica set, see "Local database")
pnpm db:up             # start MongoDB (docker compose up -d --wait); dev, db:setup, db:reset and test:db run it first
pnpm db:down           # stop and remove the container; the data volume survives
pnpm db:generate       # regenerate the Prisma client after any schema change
pnpm db:push           # push schema to the local database
pnpm db:seed           # seed database
pnpm db:setup          # up + push + generate + seed: a fresh clone's one command after install
pnpm db:reset          # up + push --force-reset + generate + seed: wipe dev data and start over

# Type-check
pnpm type-check        # tsc across every workspace via Turbo
pnpm types:watch       # watch mode across all TS projects

# Quality
pnpm lint
pnpm format
pnpm test          # domain + server + client vitest suites via Turbo (no network database needed)
pnpm test:db       # server suite against the Docker database, left in place for Compass (see "Local database")
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
```

- **`apps/server`**: Express 5 REST API (TypeScript, Node ≥ 24.5)
- **`apps/client`**: React 19 + React Router v7 + Vite 7 + TailwindCSS 4
- **`packages/database`**: Prisma client + multi-file schema (`prisma/schema/` by domain), MongoDB (Docker replica set locally, Atlas in production)
- **`packages/domain`**: Single source of truth for shared types, Zod schemas, DTOs, error codes
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

### Validation rules

- Use `.strict()` on all Zod input schemas (rejects unknown fields)
- Controllers do **not** re-validate structure (middleware already did it)
- 5-layer system: route middleware → controller logic → Prisma extensions → DB constraints → DTO mapping

### Code comments

Default to no comments — names and structure should carry the meaning; rationale belongs in docs/CONTEXT.md, not inline.

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

### React Router v7 middleware

Used for cross-cutting concerns (auth, logging, timing). Middleware chain runs parent→child going down, child→parent coming up. `next()` never throws — errors before `next()` bubble to the highest route with a loader; errors after `next()` bubble from the throwing route.

## Critical Pitfalls

1. **Regenerate with `pnpm db:generate` after any schema change** — the `prisma-client` generator is configured with `importFileExtension = "js"` (plus `runtime = "nodejs"`, `moduleFormat = "esm"`), so generated imports carry `.js` natively. No post-processing step is involved any more.
2. **Every async route handler must use `catchAsync`** — uncaught promise rejections won't reach the centralized error middleware otherwise. `defineHandler` does this for you.
3. **Every route accepting input must go through `defineHandler`** — never mount `validateSchema` by hand, and never skip it.
4. **Build order matters**: if types are missing, ensure `packages/database` and `packages/domain` are built before `apps/server`.

## Local database

Dev, seeding, the opt-in test path and Compass all use the one MongoDB in `docker-compose.yml`: a
single-node replica set (`rs0`) on `localhost:27017`, which Prisma requires because nested writes run
in transactions. `pnpm db:up` starts it (`docker compose up -d --wait`), and `pnpm dev`,
`dev:server`, `db:setup`, `db:reset` and `test:db` all run that first, so the container is only ever
started by hand after a `pnpm db:down`. The `--wait` matters: plain `up -d` returns before the
healthcheck has initiated the set, and the first schema push then fails. The healthcheck is what
runs `rs.initiate()`, so the service works when started on its own. `pnpm test` and CI never start
it.

```
dev     -> mongodb://localhost:27017/audiophile?replicaSet=rs0&directConnection=true
tests   -> mongodb://localhost:27017/audiophile-test?replicaSet=rs0&directConnection=true   (TEST_DATABASE_URL)
Compass -> mongodb://localhost:27017
```

The image tag in `docker-compose.yml` and `MONGODB_VERSION` in `global-setup.ts` are one version;
bump them together, and only after checking `fastdl.mongodb.org` has the darwin/arm64 binary and
Docker Hub has the tag. Why it is 8.2 rather than the 8.0 Atlas runs is in
`docs/adr/0004-local-mongodb-is-a-docker-replica-set-on-8-2.md`. Port 27017 has to be free, so a
Homebrew `mongodb-community` service must be stopped first. No local run touches Atlas; its
connection string belongs only to deployment.

## Environment Variables

**`packages/database/.env`**

```
DATABASE_URL=mongodb://localhost:27017/audiophile?replicaSet=rs0&directConnection=true
```

**`apps/server/.env`**

```
DATABASE_URL=mongodb://localhost:27017/audiophile?replicaSet=rs0&directConnection=true
NODE_ENV=development
JWT_SECRET=<min 32 chars>
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=20000
PORT=8000
LOG_LEVEL=debug
```

`LOG_LEVEL` is optional; unset it defaults per environment — `debug` in development, `info` in production, `silent` in test.

`NODE_ENV` controls error verbosity: `development` returns full stack traces; `production` sanitizes responses. `test` is set by the vitest configs and behaves like `production` (logger silent, no localhost CORS origin, sanitized errors).

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

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
