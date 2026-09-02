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

# Database
pnpm db:generate       # regenerate the Prisma client after any schema change
pnpm db:push           # push schema to MongoDB Atlas
pnpm db:seed           # seed database

# Type-check
pnpm types:watch       # watch mode across all TS projects

# Quality
pnpm lint
pnpm format
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
- **`packages/database`**: Prisma client + multi-file schema (`prisma/schema/` by domain), MongoDB Atlas
- **`packages/domain`**: Single source of truth for shared types, Zod schemas, DTOs, error codes
- **`packages/config-eslint`** / **`packages/config-typescript`**: Shared configs

## Server Conventions

### Request lifecycle

```
Route → validateSchema middleware → Controller → Service → Prisma
```

- **`catchAsync`** — wrap every async route handler; centralized error middleware handles the rest
- **`validateSchema(ZodSchema)`** — validates `params`, `body`, `query`; validated data lands in `req.verified`
- **`AppError`** — throw with error codes from `@repo/domain/error-codes`; never throw raw errors
- **Zod errors** — auto-converted to `AppError(422, VALIDATION_ERROR)` by error middleware

### Service layer

Extend `AbstractCrudService<Entity, CreateInput, UpdateInput, DTO>` (4 type params) and implement:
`toDTO`, `persistFindMany`, `persistFindById`, `persistCreate`, `persistUpdate`, `persistDelete`.

All query building (where, select, orderBy) belongs inside `persistFindMany` via private helpers — it is **not** abstracted by the base class.

Skip the service layer for simple pass-through CRUD; go controller → Prisma directly.

### Validation rules

- Use `.strict()` on all Zod input schemas (rejects unknown fields)
- Controllers do **not** re-validate structure (middleware already did it)
- 5-layer system: route middleware → controller logic → Prisma extensions → DB constraints → DTO mapping

### Domain package naming

| Suffix | Purpose |
|--------|---------|
| `*CreateInput` / `*UpdateInput` | write operations |
| `*DTO` | read responses |
| `*WhereInput` | filter params |
| `*Select` | field selection |
| `ExtendedQueryParams` | pagination/sorting |

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
2. **Every async route handler must use `catchAsync`** — uncaught promise rejections won't reach the centralized error middleware otherwise.
3. **Every route accepting input must use `validateSchema`** — never skip it.
4. **Build order matters**: if types are missing, ensure `packages/database` and `packages/domain` are built before `apps/server`.

## Environment Variables

**`packages/database/.env`**
```
DATABASE_URL=mongodb+srv://...
```

**`apps/server/.env`**
```
DATABASE_URL=mongodb+srv://...
NODE_ENV=development
JWT_SECRET=<min 32 chars>
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=20000
PORT=8000
```

`NODE_ENV` controls error verbosity: `development` returns full stack traces; `production` sanitizes responses.

## Active TODOs

See [`todos.js`](todos.js) at the repo root for tracked tasks.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `t-bendet/audiophile-ecommerce-v5`, managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label named after its role. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
