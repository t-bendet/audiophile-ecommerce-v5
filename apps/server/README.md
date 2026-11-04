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
- `authenticate` resolves the user through `validateTokenAndGetUser`, which answers a
  deactivated account's live token with `ACCOUNT_DEACTIVATED` (403) and the message "This account
  has been deactivated.", so its open session ends on its next request. Login answers the same way
  for a deactivated account only once the password is right; a wrong password keeps the generic
  `INVALID_CREDENTIALS`, and `GET /auth/status` reports the account as not authenticated. The
  database client does not hide a deactivated account, so these checks are the only thing that
  keeps one out ([database guide](../../packages/database/README.md#roles)).

[`admin.route.ts`](src/routes/admin.route.ts), mounted at `/api/v1/admin`, holds the admin reads
that cross users: `GET /admin/orders` lists every order newest first, filtered by `status`,
`paymentStatus`, an exact `orderId`, a case-insensitive `customerEmail` fragment or an exact
`userId`, `GET /admin/orders/:orderId` returns any user's order with its customer, and
`GET /admin/stats?period=` (`7d`, `30d`, `90d` or `all`, default `30d`; any other value is rejected
per [ADR 0002](../../docs/adr/0002-unknown-sort-and-fields-values-are-rejected.md)) answers the
dashboard's landing numbers for the orders created in the period: a count per order status with
zeros included, the revenue (the sum of `total` over orders whose payment status is Paid, whatever
their order status), up to five best sellers by quantity across order items, and the users created
in the period. [`stats.service.ts`](src/services/stats.service.ts) composes them from the order
service's Prisma `groupBy` and `aggregate` calls and the user service's count; nothing scans orders
in application code. The router
applies `authenticate, authorize("ADMIN")` once, so a guest gets 401 and a shopper 403 on every
path under it. The user router's admin section serves the users slice: `GET /users` pages every
account, deactivated ones included, filtered by `search` (a case-insensitive fragment of the name
or email), `role` and `active` (`true` or `false`); an unknown value is rejected like an unknown
sort or field ([ADR 0002](../../docs/adr/0002-unknown-sort-and-fields-values-are-rejected.md)).
`PATCH /users/:id` answers `FORBIDDEN` for `active: false` or any `role` on the requesting admin's
own id, and for `role: "USER"` on the last active admin; inactive admins do not count. There is
no admin user delete: deactivation is the soft delete. `DELETE /products/:id` answers
`RESOURCE_IN_USE` (409) for a product with order items or in a site config slot and removes the
product's cart items otherwise. The order router keeps `GET /orders/:orderId` scoped to the
signed-in shopper, and admin writes stay in each resource router's admin section:
`PATCH /orders/:orderId/status` and
`PATCH /orders/:orderId/payment-status` move an order along the `@repo/domain` transition tables
(`ORDER_STATUS_TRANSITIONS`, `PAYMENT_STATUS_TRANSITIONS`) and answer a move the table forbids with
`ORDER_ALREADY_PROCESSED` naming the current and requested values. The products slice and the
homepage slice reuse the resource routers' admin sections as they stand: `PATCH /products/:id`
takes any subset of the product's fields, and `PATCH /config/:id` takes any subset of the four
homepage slots. [`config.service.ts`](src/services/config.service.ts) checks the slots the body
sends against the stored config before writing: every slot must name a different product, the
featured slot's product must carry a `featuredImage` and a showcase slot's product a
`showCaseImage`, and the product must exist. A body that breaks a rule is answered with
`VALIDATION_ERROR` carrying one detail per offending field at `["body", <slot>]`, so the admin
form shows it under that select ([ADR 0006](../../docs/adr/0006-server-validation-errors-belong-to-the-form.md)).

[`sitemap.route.ts`](src/routes/sitemap.route.ts) is the one router mounted outside `/api/v1`:
`GET /sitemap.xml` renders the home, category and product pages from the live catalogue as
absolute URLs on the requesting origin, read from `req.protocol` and `req.host` so the Worker's
forwarded headers apply. The Worker forwards that path to the container
([deployment](../../docs/deployment.md)); `robots.txt` is a client asset.

[`rateLimiters.ts`](src/utils/rateLimiters.ts) holds the limiters: a global flood cap on `/api` and
stricter per-route quotas mounted in the route files (login, signup, order creation, the forgot
password request). A rejection leaves through `next()`, so it is the standard envelope with
`TOO_MANY_REQUESTS` (429), the limiter's own `message` and the `requestId`, and the response keeps
the `RateLimit-*` (draft-6) and `Retry-After` headers. Every limiter stands down under
`NODE_ENV=test`; [`rate-limit.test.ts`](test/rate-limit.test.ts) and a route test that needs a
limiter's policy build a small app with `createRateLimiter` and the exported options instead.

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

Query building (`where`, `orderBy`) belongs inside `persistFindMany` and its
private helpers, not new abstract base-class hooks. Use the shared parsers in
[`query.ts`](src/utils/query.ts); [`product.service.ts`](src/services/product.service.ts)
shows the current implementation. A list's `fields=` is a lower bound, not a projection: the
service checks it against the entity's whitelist with `rejectUnknownFields` and reads the full
row, so every response is the complete `*DTO` and no service passes a `select` to Prisma
([ADR 0009](../../docs/adr/0009-field-selection-never-drops-a-required-member.md)). When changing
list-query behavior, read
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

## Email

Every email leaves through one seam
([ADR 0011](../../docs/adr/0011-email-leaves-through-one-transport-that-node-env-selects.md)),
[`email.ts`](src/utils/email.ts): a rendered `EmailMessage`
(`to`, `subject`, `text`, `html`, `idempotencyKey`) handed to the transport `NODE_ENV` selects.
Under `test` it is the in-memory `outbox`; elsewhere it is Resend over its HTTPS send endpoint with
a plain `fetch` when `EMAIL_API_KEY` is set, and the pino logger otherwise, so a fresh clone in
development sees the rendered text in the terminal and never needs a key. There is no second
toggle. The sender is `Audiophile <EMAIL_FROM>`: the address is configuration, the display name is
code. Every send carries Resend's `Idempotency-Key` named after the business event
(`order-confirmation/<orderId>`), so a retried request cannot send twice. The env schema in
[`env.ts`](src/utils/env.ts) requires `EMAIL_API_KEY` only under `production`; the Worker and
secret wiring is in the [deployment runbook](../../docs/deployment.md#production-environment).

Templates are small functions in [`src/emails`](src/emails), raw HTML plus a plain-text part, no
template library. [`email.service.ts`](src/services/email.service.ts) renders and sends: a
transport failure is logged through the request logger it is given, so the line carries the request
id, and the caller's response is unchanged. `POST /orders` awaits `sendOrderConfirmation` after the
order is created, so the outbox holds the message when the 201 lands; the email says the order is
received and how payment is taken (`paymentInstructions` in `@repo/domain`, the sentence the
confirmation page shows too), never that payment was taken, because an admin sets payment status by
hand.

`POST /auth/forgot-password` validates its body with `AuthForgotPasswordRequestSchema` and answers
200 with the empty envelope for a known, unknown or deactivated email alike, so the response never
says whether an account exists. Only an active user is issued a token: 32 random bytes, emailed raw
and stored on the user as its SHA-256 hash in `passwordResetToken` beside `passwordResetExpires`,
which is `PASSWORD_RESET_EXPIRY_MS` from `@repo/domain` (one hour) after the request. A new request
overwrites both, so only the latest link works. The link is
`<CLIENT_URL>/auth/reset-password?token=<token>`; `CLIENT_URL` is the storefront origin from the env
schema, never the request's `Host`, which a caller controls. The send is awaited like the order
confirmation, under the key `password-reset/<userId>/<expiry epoch ms>`, and the route is behind
`passwordResetLimiter` (three requests per hour per IP).

`POST /auth/reset-password` validates `{ token, password, passwordConfirm }` with
`AuthResetPasswordRequestSchema`, under the signup password rules; the token travels in the body,
never the URL, so it stays out of the request log. The service looks the user up by the token's
hash with `passwordResetExpires` still ahead, then writes the new password and clears both token
fields in one `prisma.user.update` whose `where` names the hash too, so a second use, a concurrent
one included, finds no record. It must stay `update`: the database client hashes the password only
in that hook. An unknown, expired, replaced or used token, an empty one included, answers
`PASSWORD_RESET_TOKEN_INVALID` (400) with the message "This reset link is invalid or has expired."
and one detail at `["body", "token"]`; it is not `INVALID_TOKEN`, which the client reads as a dead
session. A deactivated account answers `ACCOUNT_DEACTIVATED` like login. Success sets the auth cookie
as login does and answers the user. The password write moves `passwordChangedAt`, so
`validateTokenAndGetUser` refuses every session signed in before the reset with `UNAUTHORIZED`; the
new cookie is signed after the write and survives. The route has no limiter of its own:
`passwordResetLimiter` is one store, so sharing it would let three forgot requests lock the reset
out, and the token carries 256 bits; the global `apiLimiter` still applies.

Route tests import `outbox` and read it directly, clearing it in `beforeEach` beside
`resetDatabase`; [`order.route.test.ts`](test/order.route.test.ts) asserts the recipient, subject,
body and idempotency key, and makes the transport reject to show the order is still created;
[`password-reset.route.test.ts`](test/password-reset.route.test.ts) reads the token out of the
link and compares its hash with the stored one, then spends it on the reset route; its session test
backdates the earlier cookie with `staleAuthCookie`, because `iat` has one-second resolution. The E2E suite imports no server code, so [`test.route.ts`](src/routes/test.route.ts) is mounted at
`/api/v1/test` only under `NODE_ENV=test`: `GET /test/outbox?to=<email>` returns that recipient's
messages (every message without `to`) and `DELETE /test/outbox` empties it. In every other
environment the path is the JSON 404 any unknown API path gets.

## Errors and logging

Raise expected application failures with `new AppError(message, ErrorCode.X)` from
`@repo/domain`. The semantic code determines the default HTTP status; definitions live in
[`error-codes.ts`](../../packages/domain/src/error-codes.ts) and the constructor in
[`app-error.ts`](../../packages/domain/src/app-error.ts). Let unexpected failures reach
the boundary rather than catching and disguising them as client errors.

[`error.middleware.ts`](src/middlewares/error.middleware.ts) normalizes known Prisma,
JWT, Zod, and body-parser errors into the shared response envelope. Rejected schema input
uses `VALIDATION_ERROR` (422), including middleware validation and the Zod safety net.
Body-parser failures use `PAYLOAD_TOO_LARGE` (413) for oversized bodies and `INVALID_BODY`
(400) for malformed or unsupported bodies.
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
and pushes the schema to one database per Vitest worker, `audiophile-test-1` …
`audiophile-test-<maxWorkers>`, so their unique indexes exist. [`setup.ts`](test/helpers/setup.ts)
points `DATABASE_URL` at the database for its `VITEST_POOL_ID` before importing the app, so
test files run in parallel and each truncates only its own worker's database.
[`workerDatabaseUrl`](test/helpers/worker-database-url.ts) is the only code that names a
test database. The MongoDB binary is downloaded during installation and cached; normal tests
need no Docker.

Only `TEST_DATABASE_URL` opts into an external test database; a developer or CI
`DATABASE_URL` does not select it. `pnpm test:db` uses the same per-worker databases,
`audiophile-test-1` … `audiophile-test-N`, on the local Docker server and leaves them
available for inspection. Never point these tests at the development `audiophile` database
or production: `resetDatabase` truncates collections.
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
