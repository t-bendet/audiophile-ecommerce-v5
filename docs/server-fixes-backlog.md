# Server Fixes Backlog

The 17 improvements folded into [`express-server-blueprint.md`](./express-server-blueprint.md),
re-cast as actionable work items **for this repo** (`audiophile-ecommerce-v5`).

15 apply here. 2 are Postgres-only and are listed at the end as N/A with the reasoning.

Each item: what's wrong → where → why it matters → the fix → blast radius → how to verify.

**Suggested order:** P0 → P1 → P3 (tooling, unblocks verifying the rest) → P2 (the big typed-request
refactor last, since it touches every controller).

---

## P0 — live bugs

### 1. Two order routes return 500 on every request

**Where:** `packages/domain/src/order.ts:187` and `:205`

```ts
params: z.object({ orderId: IdValidator }),    // ← the factory, not a schema
```

Everywhere else in the codebase it's `IdValidator()`. Here the _function_ is passed.

**Why it matters:** Zod 4 constructs the object fine, then throws
`Invalid element at key "orderId": expected a Zod schema` **at parse time**. That throw happens
inside `validateSchema`, so it's a plain `Error` — not a `ZodError` — which means `normalizeError`
passes it through untouched and `sendErrorProd` returns a generic **500 INTERNAL_ERROR**.

Affected routes (`apps/server/src/routes/order.route.ts:35,46`):

- `GET /api/v1/orders/:orderId`
- `PATCH /api/v1/orders/:orderId/status`

Both are unconditionally broken in production. Verified by probe, not inferred.

**Fix:**

```ts
params: z.object({ orderId: IdValidator("Order") }).strict(),
```

(Add `.strict()` while you're there — the other entity schemas have it, these two don't.)

**Blast radius:** 2 lines.

**Verify:**

```bash
curl -s localhost:8000/api/v1/orders/<valid-24-char-id> -H "Cookie: jwt=<token>" | jq '.success'
# before: false / 500 INTERNAL_ERROR — after: true
```

---

### 2. Production errors are never logged

**Where:** `apps/server/src/middlewares/error.middleware.ts:184`

```ts
// Programming or other unknown error: don't leak error details
if (process.env.NODE_ENV === "development") {
  console.error("ERROR 💥", err);
}
return res.status(500).json(/* generic message */);
```

**Why it matters:** this branch only runs in **production** (`sendErrorDev` handles development), so
the condition is never true. Every unknown 500 in production is swallowed silently — the client gets
"Something went very wrong!" and there is no record anywhere of what happened. This is the single
highest-value fix in the list: it's the difference between debuggable and not.

Also note it reads `process.env.NODE_ENV` directly instead of the validated `env`.

**Fix:** drop the condition; log unconditionally, and log 5xx `AppError`s too.

```ts
const sendErrorProd = (err: unknown, req: Request, res: Response) => {
  if (err instanceof AppError) {
    if (err.code === ErrorCode.INVALID_CREDENTIALS) clearAuthCookie(req, res);
    if (err.statusCode >= 500) console.error("ERROR 💥", err); // ← add
    return res.status(err.statusCode).json(/* … */);
  }

  console.error("ERROR 💥", err); // ← always
  return res.status(500).json(/* generic */);
};
```

Use `logger.error` instead of `console.error` once fix #13 lands.

**Blast radius:** ~4 lines, one file.

**Verify:** temporarily throw a raw `new Error("boom")` from a controller, run with
`NODE_ENV=production`, confirm the stack appears in the server output and the response body stays
generic.

---

## P1 — correctness & robustness

### 3. Database connection isn't awaited before the server listens

**Where:** `apps/server/src/index.ts:16-53`

`prisma.$connect()` is a floating promise chain; `app.listen()` runs immediately after. The server
accepts traffic while the connection is still being established, and a connection failure races the
listener.

**Fix:** wrap boot in an async `start()`, `await prisma.$connect()` inside a try/catch that exits
non-zero, then listen. Full version in blueprint §6.

**Blast radius:** `index.ts` only.

**Verify:** point `DATABASE_URL` at a dead host — the process should exit 1 without ever printing
"Server : port 8000".

---

### 4. Only SIGTERM is handled, and shutdown can hang forever

**Where:** `apps/server/src/index.ts:65-73`

- `SIGINT` (Ctrl-C in dev) isn't handled at all — no `prisma.$disconnect()`.
- `server.close()` waits indefinitely for open connections; nothing forces exit.
- `unhandledRejection` closes the server but never disconnects Prisma.

**Fix:** one `shutdown(signal, exitCode)` shared by `SIGTERM` / `SIGINT` / `unhandledRejection`,
guarded by a `shuttingDown` flag, with a 10s `setTimeout(...).unref()` force-exit. Full version in
blueprint §6.

**Blast radius:** `index.ts` only.

**Verify:** `pnpm dev:server`, Ctrl-C — should log "shutting down gracefully" then "shutdown
complete" and exit promptly.

---

### 5. `?sort=` is not whitelisted

**Where:** every `parseXOrderBy` — `category.service.ts:121`, `product.service.ts`,
`user.service.ts`, `config.service.ts`

```ts
return sort.split(",").map((field) => {
  const isDescending = field.startsWith("-");
  const fieldName = isDescending ? field.substring(1) : field;
  return { [fieldName]: isDescending ? "desc" : "asc" }; // ← any field name reaches Prisma
});
```

**Why it matters:** `?sort=nonexistent` produces a `PrismaClientValidationError`, which
`handleValidationErrorDB` turns into a 400 — so no crash, but the failure mode is
client-controlled and the internal query shape leaks through error messages in dev. `parseXSelect`
already whitelists; sort should match.

**Fix:** whitelist against the same `validFields` list `parseXSelect` uses, falling back to the
default order when nothing survives. Best done together with #10 (shared `utils/query.ts`).

**Blast radius:** 4 services (or 1 shared util if bundled with #10).

**Verify:** `GET /api/v1/categories?sort=hax` → 200 with default ordering, not 400.

---

### 6. `exports` map condition order in `@repo/domain`

**Where:** `packages/domain/package.json`

```json
"exports": { ".": { "import": "./dist/src/index.js", "types": "./dist/src/index.d.ts" } }
```

Export conditions are matched **in declaration order**. `"import"` resolves first, so tooling that
relies on the map (rather than the top-level `"types"` fallback) never sees the declarations.

**Fix:**

```json
"exports": { ".": { "types": "./dist/src/index.d.ts", "import": "./dist/src/index.js" } }
```

**Blast radius:** 1 line. Same check worth doing on `packages/database/package.json`.

**Verify:** `pnpm --filter server run type-check` still clean.

---

### 7. Stray space in a validator label

**Where:** `packages/domain/src/product.ts:152`

```ts
params: z.object({ id: IdValidator("Product ") }).strict(),
```

Produces `"Product  Id is required"` (double space) in the client-facing error message.

**Fix:** `IdValidator("Product")`.

**Blast radius:** 1 character.

---

## P2 — type safety & architecture

### 8. `req.verified` is untyped — schemas don't reach controllers

**Where:**

- `packages/domain/src/common.ts:237-251` — `createRequestSchema` casts its return to
  `z.ZodType<RequestSchema>` with `as any`, discarding the inferred `{params, body, query}` types
- `apps/server/src/app.ts:16` — `verified?: Record<string, any>`
- all 7 controllers — `req.verified?.params.id`, `req.verified?.body` are `any`

**Why it matters:** the whole point of defining schemas in the domain package is that controllers
inherit their types. Right now renaming a schema field compiles fine and fails at runtime. Every
controller access is `any` with an optional-chain + non-null-assertion dance to hide it.

**Fix (3 steps):**

1. `common.ts` — stop widening the return type:

   ```ts
   export const createRequestSchema = <
     P extends z.ZodTypeAny = z.ZodObject<Record<string, never>>,
     B extends z.ZodTypeAny = z.ZodUndefined,
     Q extends z.ZodTypeAny = z.ZodObject<Record<string, never>>,
   >(options?: {
     params?: P;
     body?: B;
     query?: Q;
   }) =>
     z.object({
       params: (options?.params ?? z.strictObject({})) as P,
       body: (options?.body ?? z.undefined()) as B,
       query: (options?.query ?? z.object({})) as Q,
     });
   ```

   (The `RequestSchema` type export becomes dead — remove it.)

2. `validation.middleware.ts` — add the narrowed request type:

   ```ts
   export type ValidatedRequest<S extends ZodType> = Request & {
     verified: z.infer<S>;
   };
   ```

   and change the augmentation in `app.ts` to `verified?: unknown` (intersection then collapses to
   the schema type). Consider moving the augmentation to `src/types/express.d.ts` while you're here.

3. `catchAsync.ts` — return `RequestHandler` rather than the narrowed handler type, so routers still
   accept it:
   ```ts
   const catchAsync =
     <TReq extends Request = Request>(
       fn: (req: TReq, res: Response, next: NextFunction) => Promise<unknown>,
     ): RequestHandler =>
     (req, res, next) => {
       fn(req as TReq, res, next).catch(next);
     };
   ```

Then controllers become:

```ts
export const getCategoryById = catchAsync<
  ValidatedRequest<typeof CategoryGetByIdRequestSchema>
>(async (req, res) => {
  const dto = await categoryService.get(req.verified.params.id); // string, checked
  res.status(200).json(createSingleItemResponse(dto));
});
```

**Blast radius:** largest item on the list — `common.ts`, `validation.middleware.ts`,
`catchAsync.ts`, `app.ts`, and all 7 controller files. Expect the compiler to surface real
mismatches once the `any` is gone (especially in `cart` and `order`, where bodies are destructured).
Do this one on its own branch.

**Verify:** `pnpm --filter server run type-check`; then deliberately rename a field in one request
schema and confirm the controller fails to compile.

---

### 9. `AbstractCrudService.getAll(query: any)`

**Where:** `apps/server/src/services/abstract-crud.service.ts:85-89, 101`

`persistFindMany` is declared as `{ page?, limit?, [key: string]: any }`, so every service
destructures untyped params.

**Fix:** add a 5th generic:

```ts
export abstract class AbstractCrudService<
  Entity, CreateInput, UpdateInput, DTO,
  Query extends baseQueryParams = baseQueryParams,
> {
  protected abstract persistFindMany(
    params: Query & { page: number; limit: number; skip: number; take: number },
  ): Promise<{ data: Entity[]; total: number }>;

  async getAll(query: Query): Promise<{ data: DTO[]; meta: Meta }> { … }
}
```

Then e.g. `CategoryService extends AbstractCrudService<…, ExtendedQueryParams<{ name?: NAME }>>`.

Defaulting the generic means existing subclasses keep compiling until you tighten them one at a
time. `product.service.ts` already types its params with `ExtendedQueryParams<…>` — it just isn't
connected to the base class.

**Blast radius:** base class + 5 services, incrementally.

---

### 10. `parseXSelect` / `parseXOrderBy` duplicated in 4 services

**Where:** `category.service.ts:101-131`, `user.service.ts:108-160`, `product.service.ts`,
`config.service.ts`

Four near-identical copies of the same two functions, plus the pagination arithmetic repeated in
every `persistFindMany`.

**Fix:** add `apps/server/src/utils/query.ts` with `parsePagination`, `buildMeta`, `parseSelect`,
`parseOrderBy` (full implementation in blueprint §7 — it also fixes #5's missing whitelist). Each
service then keeps only its entity-specific `buildXWhere`.

**Blast radius:** 1 new file, 4 services slimmed, base class `getAll` uses `parsePagination` +
`buildMeta`.

**Verify:** existing list endpoints return identical payloads for the same query strings — compare
before/after with `curl … | jq` on `/categories`, `/products`, `/users`.

---

### 11. Dead duplicate method in `UserService`

**Where:** `apps/server/src/services/user.service.ts:108` (`parseSelect`) vs `:147`
(`parseUserSelect`)

Two implementations of the same thing; only `parseUserSelect` is called (`:43`). The dead one is
`protected`, so it isn't even flagged as unused.

**Fix:** delete `parseSelect` (subsumed entirely by #10 anyway).

---

### 12. `getMe` mutates `req.params`

**Where:** `apps/server/src/controllers/user.controller.ts`

```ts
export const getMe = (req, _res, next) => {
  if (!req.user?.id) throw new AppError(…);
  req.params.id = req.user.id;      // ← smuggles a value past the validation contract
  next();
};
// and getUser then falls back: req.verified?.params.id ?? req.params.id
```

**Why it matters:** it's the one place request data enters a controller from somewhere other than
`req.verified`, which forces `getUser` to carry a fallback branch forever. It's also the only
non-`catchAsync` handler in the codebase.

**Fix:** drop `getMe` from the chain; give `/me` its own controller that reads `req.user.id`
directly and calls `userService.get(...)`. Remove the `?? req.params.id` fallback from `getUser`.

**Blast radius:** `user.controller.ts`, `user.route.ts:/me`.

**Verify:** `GET /api/v1/users/me` with a valid cookie returns the caller's record.

---

## P3 — tooling & quality

### 13. Structured logging

**Where:** `apps/server/src/app.ts:64` (`morgan("dev")`, development only), plus `console.log` /
`console.error` throughout `index.ts` and `error.middleware.ts`.

Today: no logs at all in production, no request ids, no way to correlate a client-reported error
with a server log line.

**Fix:** add `pino` + `pino-http` (`utils/logger.ts`, full version in blueprint §7) with:

- `genReqId` assigning/propagating `x-request-id`
- redaction of `authorization`, `cookie`, `set-cookie`, `*.password`, `*.passwordConfirm`
- `pino-pretty` transport in development only
- `requestId` added to the error envelope (`ErrorObjectSchema` gains `requestId: z.string().optional()`)

Replace `morgan` with `httpLogger`, and `console.*` with `logger.*` in `index.ts` and
`error.middleware.ts`. Add `LOG_LEVEL` to `utils/env.ts`.

**Blast radius:** new `utils/logger.ts`, `app.ts`, `index.ts`, `error.middleware.ts`, `env.ts`,
`common.ts` (one optional field), 2 deps.

**Worth pairing with #2** — they touch the same lines.

---

### 14. ESLint 9 running eslintrc v8 configs

**Where:** `packages/config-eslint/{library.js,next.js}`, `packages/database/.eslintrc.js`

`eslint: ^9` is installed but the shared configs are legacy `.eslintrc`-style (`extends`, `plugins`
arrays). `apps/client` already uses flat config, so the repo is split across two systems.

**Fix:** convert `packages/config-eslint` to flat config (`base.js` exporting a
`tseslint.config(...)` array), update each package's config to `import base from
"@repo/eslint-config/base.js"; export default base;`.

**Blast radius:** config package + one file per consuming package. Expect a batch of newly-surfaced
warnings on first run.

---

### 15. No tests

There is no test setup at all. Highest value per line of effort:

- one **route test** per resource via `supertest` against `app` — covers validation → controller →
  service → error middleware in one assertion
- one **service test** per service for the business rules (`filterUpdateInput` whitelists,
  ownership checks in `order.service.ts` / `cart.service.ts`)

Setup: `vitest` + `supertest`, `NODE_ENV=test` added to the `env.ts` enum, a disposable database for
integration runs. Templates in blueprint §15.

Starting point worth writing first: a regression test for fix #1, since that bug shipped undetected.

---

## Done

### 16. `fix-prisma-imports-robust.cjs` — removed

The `prisma-client` generator in `packages/database/prisma/schema/schema.prisma` now emits
NodeNext-valid imports natively:

```prisma
generator client {
  provider            = "prisma-client"
  output              = "../../generated/prisma"
  runtime             = "nodejs"
  moduleFormat        = "esm"
  importFileExtension = "js"      // ← replaces the post-generate patch
}
```

`node ./scripts/fix-prisma-imports-robust.cjs` was dropped from `db:generate` and `build`, and
`packages/database/scripts/` was deleted.

---

## Not applicable to this repo

### 17. `prisma migrate` instead of `db push` — N/A

The blueprint mandates real migrations. **MongoDB has no migration support in Prisma** — `db push`
is the only option and `pnpm db:push` is correct here. Nothing to change.

---

## Summary

| #   | Fix                                   | Priority    | Files touched     |
| --- | ------------------------------------- | ----------- | ----------------- |
| 1   | `IdValidator` uncalled → 2 routes 500 | **P0**      | 1                 |
| 2   | Production errors never logged        | **P0**      | 1                 |
| 3   | Await DB connect before listen        | P1          | 1                 |
| 4   | Unified graceful shutdown             | P1          | 1                 |
| 5   | Whitelist `?sort=` fields             | P1          | 4 (or 1 with #10) |
| 6   | `exports` condition order             | P1          | 1–2               |
| 7   | Stray space in validator label        | P1          | 1                 |
| 8   | Typed `req.verified`                  | P2          | ~11               |
| 9   | `getAll` Query generic                | P2          | 6                 |
| 10  | Shared `utils/query.ts`               | P2          | 6                 |
| 11  | Dead `parseSelect`                    | P2          | 1                 |
| 12  | `getMe` param mutation                | P2          | 2                 |
| 13  | pino structured logging               | P3          | 6                 |
| 14  | ESLint flat config                    | P3          | ~6                |
| 15  | Tests                                 | P3          | new               |
| 16  | Prisma import patch script            | P3 (done)   | 7                 |
| 17  | Migrations                            | N/A (Mongo) | —                 |

P0+P1 is roughly an afternoon and fixes two real production bugs. P2 is a weekend. P3 is ongoing.
