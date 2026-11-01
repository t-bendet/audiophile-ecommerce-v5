# Server implementation guide

Read this before changing API routes, controllers, services, error handling, or server tests.
For schema and catalogue changes, also read the [database guide](../../packages/database/README.md).
Shared schemas, DTOs, and naming follow the [domain conventions](../../docs/agents/domain.md).

## Request lifecycle

The normal path is route → validation middleware → controller → service → Prisma.
Simple pass-through CRUD can go directly from controller to Prisma; use a service for
reusable business logic, transactions, or cross-entity operations.

Every route accepting params, body, or query input uses
[`defineHandler`](src/utils/define-handler.ts). The controller supplies the request schema
once and exports a `ValidatedHandler`; the route spreads the resulting handler pair.
Read [`product.controller.ts`](src/controllers/product.controller.ts) and
[`product.route.ts`](src/routes/product.route.ts) for the maintained example.

- `defineHandler` combines `validateSchema(schema)` with `catchAsync(fn)` and infers
  `req.verified` from the schema. Controllers consume `req.verified`, not raw request input.
- Route files mount the controller's pair; they do not import request schemas or mount
  `validateSchema` separately.
- Async handlers without an input schema use [`catchAsync`](src/utils/catchAsync.ts).
- Input schemas in `@repo/domain` use `.strict()` to reject unknown fields. Middleware
  validates structure once; controllers and services check business rules and ownership.
- Authentication and role authorization live in
  [`auth.middleware.ts`](src/middlewares/auth.middleware.ts). Ownership failures follow
  [ADR 0001](../../docs/adr/0001-ownership-failures-return-403.md).

[`admin.route.ts`](src/routes/admin.route.ts), mounted at `/api/v1/admin`, holds the admin reads
that cross users: `GET /admin/orders` lists every order newest first, filtered by `status`,
`paymentStatus`, an exact `orderId`, a case-insensitive `customerEmail` fragment or an exact
`userId`, and `GET /admin/orders/:orderId` returns any user's order with its customer. The router
applies `authenticate, authorize("ADMIN")` once, so a guest gets 401 and a shopper 403 on every
path under it. The order router keeps `GET /orders/:orderId` scoped to the signed-in shopper, and
admin writes stay in each resource router's admin section: `PATCH /orders/:orderId/status` and
`PATCH /orders/:orderId/payment-status` move an order along the `@repo/domain` transition tables
(`ORDER_STATUS_TRANSITIONS`, `PAYMENT_STATUS_TRANSITIONS`) and answer a move the table forbids with
`ORDER_ALREADY_PROCESSED` naming the current and requested values.

[`sitemap.route.ts`](src/routes/sitemap.route.ts) is the one router mounted outside `/api/v1`:
`GET /sitemap.xml` renders the home, category and product pages from the live catalogue as
absolute URLs on the requesting origin, read from `req.protocol` and `req.host` so the Worker's
forwarded headers apply. The Worker forwards that path to the container
([deployment](../../docs/deployment.md)); `robots.txt` is a client asset.

The validation responsibilities are distinct: request schemas validate external input,
controllers/services enforce business rules, Prisma extensions handle persistence
transformations, database constraints enforce supported invariants, and DTO mapping
controls what leaves the API. Do not treat database types as input validation or assume
MongoDB supplies relational foreign-key enforcement.

## Services and DTOs

[`AbstractCrudService`](src/services/abstract-crud.service.ts) takes four required type
parameters (`Entity`, `CreateInput`, `UpdateInput`, `DTO`) and an optional fifth `Query`
parameter defaulting to `baseQueryParams`. Implement `toDTO`, `persistFindMany`,
`persistFindById`, `persistCreate`, `persistUpdate`, and `persistDelete`.

Query building (`where`, `select`, `orderBy`) belongs inside `persistFindMany` and its
private helpers, not new abstract base-class hooks. Use the shared parsers in
[`query.ts`](src/utils/query.ts); [`product.service.ts`](src/services/product.service.ts)
shows the current implementation. When changing list-query behavior, read
[ADR 0002](../../docs/adr/0002-unknown-sort-and-fields-values-are-rejected.md) for unknown
sort/field rejection and [ADR 0003](../../docs/adr/0003-one-default-page-size-for-every-list.md)
for the default page size.

Services return DTOs or domain results; controllers format HTTP responses with the
`@repo/domain` response helpers. The optional `filterUpdateInput` hook can enforce
service-level write restrictions; it does not replace strict request schemas.
`nullOnMissingRecord` and `falseOnMissingRecord` translate missing-record write failures
into the base class's not-found contract while allowing other database errors to escape.

Persisted images contain storage keys. [`media.ts`](src/utils/media.ts) resolves them
against the required `MEDIA_BASE_URL` during DTO mapping. Keep public URLs out of
persistence; asset publication follows the [media guide](../../packages/media/README.md).

## Errors and logging

Raise expected application failures with `new AppError(message, ErrorCode.X)` from
`@repo/domain`. The semantic code determines the default HTTP status; definitions live in
[`error-codes.ts`](../../packages/domain/src/error-codes.ts) and the constructor in
[`app-error.ts`](../../packages/domain/src/app-error.ts). Let unexpected failures reach
the boundary rather than catching and disguising them as client errors.

[`error.middleware.ts`](src/middlewares/error.middleware.ts) normalizes known Prisma,
JWT, and Zod errors into the shared response envelope. Rejected input uses
`VALIDATION_ERROR` (422), including middleware validation and the Zod safety net.
Development responses include stacks; test and production responses omit stacks and
replace unknown failures with a generic internal-error message. `AppError` messages and
details are returned, so keep their contents suitable for clients.

Errors are logged once at the request boundary. The middleware assigns `res.err` and
`res.errLogLevel`, and [`pino-http`](src/utils/logger.ts) emits the completion line.
Non-operational failures and 5xx responses use `error`; other client faults use `warn`.
Controllers and services throw rather than logging the same failure again. For other
request-scoped logging, use `req.log`, which carries `requestId`, rather than the bare
logger. The response's `x-request-id`, error envelope's `requestId`, and log line correlate
the same request.

## Tests

Run the focused server suite with `pnpm --filter server test` after its workspace
dependencies are built, or use `pnpm test` from the root for Turbo's dependency ordering.
See [verification](../../docs/agents/verification.md) for checks beyond this workspace.

Route tests exercise the real Express [`app`](src/app.ts) through supertest. Use fixture
builders, `resetDatabase`, and real signed `authCookie(userId)` values from
[`test/helpers/database.ts`](test/helpers/database.ts); seed only what each test needs.
[`user.route.test.ts`](test/user.route.test.ts) is a maintained example. Type-level tests
for validated requests and handler composition run through the Vitest typecheck config.

[`global-setup.ts`](test/helpers/global-setup.ts) starts an in-memory MongoDB replica set
and pushes the schema so its unique indexes exist. [`setup.ts`](test/helpers/setup.ts)
sets `DATABASE_URL` before importing the app. Test files share the database and truncate
its collections, so `fileParallelism` stays off. The MongoDB binary is downloaded during
installation and cached; normal tests need no Docker.

Only `TEST_DATABASE_URL` opts into an external test database; a developer or CI
`DATABASE_URL` does not select it. `pnpm test:db` uses the local Docker database
`audiophile-test` and leaves it available for inspection. Never point these tests at the
development `audiophile` database or production: `resetDatabase` truncates collections.
For database startup and version changes, follow the
[database guide](../../packages/database/README.md). Browser tests have a separate
[E2E guide](../e2e/README.md).

If an intermittent local supertest request receives a status the app never returns,
especially 405, check for an orphaned `workerd` listener before diagnosing a product bug:

```bash
lsof -nP -iTCP -sTCP:LISTEN | rg -i workerd
```

An orphan left by `wrangler dev` can occupy an ephemeral port used by supertest. Stop the
identified orphan process and rerun the failing test.
