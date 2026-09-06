# Architecture Overview — Audiophile E-Commerce v5

## Monorepo Structure (Turborepo + pnpm)

Three workspaces with enforced build ordering:

```
packages/database → packages/domain → apps/server
                                    → apps/client
```

**Why Turborepo over Nx/bare pnpm?** Turborepo is lightweight and opinionated — `dependsOn: ["^build"]` handles build order automatically. Remote caching is built-in. Nx adds more complexity (plugins, project graph config) that isn't needed here.

**Why pnpm over npm/yarn?** Strict `node_modules` hoisting rules prevent phantom dependencies (accessing packages you didn't declare). Much faster installs via hard-linking.

---

## Backend: Express + TypeScript

**Layered architecture:**

```
Route → validateSchema middleware → Controller → Service → Prisma
```

### Key Patterns

**1. `AbstractCrudService<Entity, CreateInput, UpdateInput, DTO>`**
Base class handles pagination meta; concrete subclasses implement six abstract methods — `toDTO` plus five `persist*` methods. Query building (where/select/orderBy) stays inside the concrete service, not abstracted further. This avoids the common pitfall where over-abstracted ORMs become unmaintainable.

**2. `catchAsync` wrapper**
Instead of try/catch in every handler, all async controllers are wrapped once. Errors propagate to a centralized error middleware.

**3. `req.verified` contract**
Validated input is written here by `validateSchema(ZodSchema)` middleware before the controller even runs. Controllers never touch raw `req.body` or `req.params`. Zod schemas use `.strict()` to reject unknown fields. `req.verified` is narrowed to the schema's inferred type, so renaming a schema field breaks the controller at compile time.

**3a. `defineHandler(schema, fn)`**
The schema and the handler that reads it are declared together: `defineHandler` returns the `[validateSchema(schema), catchAsync(fn)]` pair, the controller exports it, and the route spreads it (`router.post("/", ...controller.createX)`). The schema is named once, route files import none, and a handler cannot be mounted against a schema other than the one it was written for — the drift is unrepresentable rather than merely detectable. `catchAsync` alone remains for the handful of handlers whose routes mount no schema.

**4. Semantic `ErrorCode` enum (in `@repo/domain`)**
Shared between client and server. One source of truth maps `ErrorCode → HTTP status`. Both sides speak the same error vocabulary.

**5. JWT auth with `passwordChangedAt` invalidation**
Tokens issued before a password change are rejected even if not expired — without needing a token blacklist.

---

## Database: MongoDB (Prisma)

### Why MongoDB over PostgreSQL/MySQL?

| Factor             | MongoDB                                                                                             | SQL                                               |
| ------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Schema flexibility | Embedded documents (e.g. `ProductImages` stored inline) avoid join overhead                         | Requires separate `product_images` table + joins  |
| Data shape         | Products have nested, varied structures (image sets per breakpoint) that map naturally to documents | Would need normalization or JSON columns          |
| Tradeoff           | No true foreign key constraints; multi-document transactions need a replica set                     | ACID transactions, enforced referential integrity |

**Concrete example:** `ProductImages` is a Prisma `type` (embedded document) — responsive image URLs for desktop/tablet/mobile live inside the product document. In SQL you'd need a separate table and joins on every product query.

### One Local Replica Set

Prisma wraps nested writes in transactions, and MongoDB only allows those on a replica set, so even a single local node has to be one. `docker-compose.yml` runs it: MongoDB 8.2 on `localhost:27017`, initiated by its own healthcheck, with `audiophile` for dev and `audiophile-test` for the opt-in test path (`TEST_DATABASE_URL`). Route tests default to an in-memory replica set on the same pinned version, so CI and a fresh clone need no Docker. Atlas is production only. Why the pin is 8.2 rather than Atlas's 8.0 is in `docs/adr/0004-local-mongodb-is-a-docker-replica-set-on-8-2.md`.

### Multi-file Prisma Schema

Schema split by domain (`user.prisma`, `product.prisma`, `category.prisma`, `config.prisma`) instead of one monolithic file. Easier to navigate on a team.

### ESM-native Client Generation

`pnpm db:generate` is plain `prisma generate` — there is no post-processing step. The `prisma-client` generator is configured with `runtime = "nodejs"`, `moduleFormat = "esm"` and `importFileExtension = "js"`, so the generated imports carry the explicit `.js` extensions Node.js ESM requires.

---

## Domain Package (`@repo/domain`)

Shared between server and client:

- **Zod schemas** — for request validation (server) and form validation (client). Same schema, no duplication.
- **DTOs** — what the API actually returns (sensitive fields like passwords never leak out).
- **`ErrorCode` enum** — client can type-check error codes from API responses.

**Why a shared domain package?** Single source of truth. If you change `ProductUpdateInput`, TypeScript will catch mismatches on both the route handler and whatever calls it.

---

## Frontend: React Router v7 + TanStack Query + Axios

### React Router v7 (framework/data mode)

- All routes are **lazy-loaded** — no bundle bloat on initial load.
- `clientLoader(queryClient)` pattern — route loaders prefetch data into the TanStack Query cache before the component renders. No loading spinners on navigation.
- Middleware chain (v7 feature) for cross-cutting concerns (auth, performance timing) without HOC wrapper hell.

### TanStack Query

- `throwOnError: true` everywhere → errors go to `ErrorBoundary`, not scattered throughout component state.
- Smart retry: 4xx → never retry (client error), 5xx/network → retry 2x with exponential backoff.
- `staleTime: 1 minute` — prevents redundant refetches on tab focus.

**Why TanStack Query over Redux/Zustand for server state?** Redux is for client-side state. TanStack Query handles the actual hard problems of server state: caching, deduplication, background refresh, optimistic updates. Mixing server state into Redux creates boilerplate without benefit.

### Axios over fetch

Interceptors for centralized error classification. Automatic JSON parsing. `withCredentials: true` for cookie-based auth without per-request config.

---

## Auth Flow

```
Login → JWT issued → stored in httpOnly cookie OR Authorization header
         ↓
Protected route → auth middleware extracts token
               → validates signature + expiry
               → checks passwordChangedAt
               → attaches user to req.user
```

`authorize("ADMIN")` middleware is applied as a barrier at the router level — not inside individual handlers — so you can't accidentally forget it on a new route.

---

## Security Layers (OWASP-aware)

| Layer                   | What it does                                        |
| ----------------------- | --------------------------------------------------- |
| Helmet                  | Security headers (XSS, clickjacking, MIME sniffing) |
| CORS allowlist          | Explicit origin list, not `*`                       |
| Rate limiting (global)  | 500 req / 15 min per IP on `/api`                   |
| Rate limiting (route)   | login 10/15min, signup 5/hr, order create 20/hr     |
| Body size limit         | 10kb cap — prevents request flooding                |
| Zod `.strict()`         | Rejects extra fields (mass assignment prevention)   |
| DTO mapping             | Sensitive fields never leave the service layer      |
| JWT `passwordChangedAt` | Revokes old tokens without a blacklist              |

Rate-limit rejections are not special-cased: the limiter hands an
`AppError(TOO_MANY_REQUESTS)` to `next()`, so a 429 comes back in the same
`ErrorResponse` envelope as every other failure, alongside the `RateLimit-*`
and `Retry-After` headers. Successful logins are refunded, so only failed
attempts burn the login quota.

---

## Interview Talking Points

**"Why not just use NestJS?"**
NestJS adds heavy DI/decorator abstraction. This project achieves the same layered architecture with plain TypeScript classes and is easier to reason about.

**"Why Zod over class-validator?"**
Zod is schema-first, works without decorators, and infers TypeScript types from schemas (DRY). `class-validator` requires duplicating the type definition as a class.

**"Why MongoDB for an e-commerce app?"**
Product catalog data is document-shaped (nested images, included items, category references). Orders and carts are denormalized snapshots by design. Joins aren't needed. Trade-off: no referential integrity enforcement at the DB level — that's handled by Prisma type safety.

**"What would you change?"**

- Aggregate queries in `getRelatedProducts` to reduce DB roundtrips (currently a tracked TODO).
- Consider a Redis cache layer for product catalog reads.
- Move config ID to environment variables.

---

**Last Updated:** September 6, 2026
