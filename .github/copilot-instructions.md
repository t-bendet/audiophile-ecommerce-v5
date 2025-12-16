# Copilot Instructions for Audiophile E-Commerce

## Monorepo Architecture

This is a **Turborepo + pnpm workspace** monorepo with:

- **`apps/server`**: Express REST API (TypeScript, Node.js)
- **`packages/database`**: Shared Prisma client and schema (multi-file schema in `prisma/schema/`)
- **`packages/domain`**: Shared types, Zod schemas, DTOs, error codes
- **`packages/config-eslint`**: ESLint configs
- **`packages/config-typescript`**: Shared tsconfig.json base

### Key Commands

- **Dev**: `pnpm dev` (all apps) | `pnpm dev:server` (server only)
- **Build**: `pnpm build` (Turbo builds all packages + apps)
- **Database**: `pnpm db:generate` → runs `prisma generate` + **custom post-processing script** ([fix-prisma-imports-robust.cjs](packages/database/scripts/fix-prisma-imports-robust.cjs)) to add `.js` extensions to generated Prisma imports (required for ESM)
- **Seed**: `pnpm db:seed` (located at `packages/database/src/seed/`)
- **Type-check**: `pnpm types:watch` (watch mode for all TS projects)

### Build Order Dependencies

Turbo automatically handles build order:

1. `packages/database` must build first (generates Prisma client)
2. `packages/domain` depends on `@repo/database` types
3. `apps/server` depends on both `@repo/database` and `@repo/domain`

**Critical**: Always run `pnpm db:generate` after schema changes, NOT just `prisma generate` (the custom script is essential for ESM compatibility).

---

## Server App Conventions

### Layered Architecture Pattern

```
Route → Middleware (validation) → Controller → Service → Prisma
```

**Key patterns:**

- **All async route handlers** must be wrapped in [`catchAsync`](apps/server/src/utils/catchAsync.ts) for error handling
- **Validation**: Use [`validateSchema(ZodSchema)`](apps/server/src/middlewares/validation.middleware.ts) middleware on routes. Schemas from `@repo/domain`. Validated data available in `req.verified` (params, body, query)
- **Error handling**: Throw [`AppError`](apps/server/src/utils/appError.ts) with error codes from `@repo/domain/error-codes`. Centralized error middleware at [error.middleware.ts](apps/server/src/middlewares/error.middleware.ts)
- **Services**: Extend [`AbstractCrudService<Entity, CreateInput, UpdateInput, DTO>`](apps/server/src/services/abstract-crud.service.ts) for CRUD operations. Implement 6 methods: `toDTO`, `persistFindMany`, `persistFindById`, `persistCreate`, `persistUpdate`, `persistDelete`. All query building (where, select, orderBy) happens **inside** `persistFindMany` using private helper methods.

### Service Layer Guidance (see [SERVICE_LAYER_EXAMPLE.md](apps/server/SERVICE_LAYER_EXAMPLE.md))

- **Use services when**: multi-step operations, transactions, complex business logic, cross-entity operations
- **Skip services for**: simple pass-through CRUD (controller → Prisma directly)
- **Transaction pattern**: Use `prisma.$transaction()` for atomic multi-step operations

### Validation Strategy (see [VALIDATION_STRATEGY.md](apps/server/VALIDATION_STRATEGY.md))

**5 layers of validation:**

1. **Route middleware** (validateSchema) - ALWAYS validate inputs here
2. **Controller logic** - Business rules, authorization
3. **Prisma extensions** - Data-level validation, password hashing, soft deletes
4. **Database constraints** - Unique, foreign keys, NOT NULL
5. **Response mapping** - DTO transformation (security, field omission)

**Rules:**

- ALWAYS validate request inputs (params, query, body) at route level
- Use `.strict()` on input validation schemas (reject unknown fields)
- Controllers do NOT re-validate structure (already validated by middleware)

### Authentication Flow

- **JWT-based**: Tokens issued on login, verified on protected routes
- **Auth middleware**: [auth.middleware.ts](apps/server/src/middlewares/auth.middleware.ts) extracts token from `Authorization: Bearer <token>` header
- **Protected routes**: Apply auth middleware to routes requiring authentication
- **Token storage**: Issued during login flow; clients must include in subsequent requests
- **User context**: Verified user ID available in route handlers after auth middleware
- **Error codes**: Use `ErrorCode.UNAUTHORIZED` (401) for missing/invalid tokens, `ErrorCode.FORBIDDEN` (403) for insufficient permissions

### Error Flow (see [ERROR_FLOW.md](apps/server/ERROR_FLOW.md))

- Development: Full error details with stack traces
- Production: Sanitized errors, structured details from validation
- Zod errors auto-converted to `AppError(422, VALIDATION_ERROR)`
- All errors caught by centralized middleware

---

## Domain Package Patterns

- **Export structure**: All exports in [packages/domain/src/index.ts](packages/domain/src/index.ts)
- **Zod schemas**: Use `.strict()` for input validation schemas (enforces no extra fields)
- **Naming conventions**:
  - `*CreateInput` / `*UpdateInput` for write operations
  - `*DTO` for read responses
  - `*WhereInput` for filter params
  - `*Select` for field selection
  - `ExtendedQueryParams` for pagination/sorting

---

## Database Package Patterns

### Prisma Schema Organization

- **Multi-file schema**: Organized by domain in `packages/database/prisma/schema/` (user.prisma, product.prisma, category.prisma, config.prisma)
- **Main schema**: [schema.prisma](packages/database/prisma/schema/schema.prisma) contains datasource, generator, and imports

### Post-Generation Processing

The [fix-prisma-imports-robust.cjs](packages/database/scripts/fix-prisma-imports-robust.cjs) script patches generated Prisma client files to add `.js` extensions to relative imports (e.g., `from './models'` → `from './models.js'`). This is **required** because:

- Project uses `"type": "module"` (ESM)
- Node.js ESM requires explicit `.js` extensions
- Prisma codegen doesn't add them by default

**Always** run `pnpm db:generate` after schema changes to trigger this post-processing.

---

## Environment Variables

### packages/database/.env

```
DATABASE_URL=mysql://user:password@localhost:3306/turborepo
```

Required for Prisma migrations, seeding, and client generation. Format: `mysql://[user]:[password]@[host]:[port]/[database]`

### apps/server/.env

```
DATABASE_URL=mysql://user:password@localhost:3306/turborepo
NODE_ENV=development
JWT_SECRET=your-secret-key-for-signing-tokens
JWT_EXPIRE=7d
PORT=5000
```

**Key variables:**

- `DATABASE_URL`: Must match database/.env (Prisma client connection)
- `NODE_ENV`: `development` or `production` (affects error responses, logging)
- `JWT_SECRET`: Used to sign/verify JWT tokens; must be strong and kept secret
- `JWT_EXPIRE`: Token expiration (e.g., `7d`, `24h`); parsed by `ms` package
- `PORT`: Server listening port (defaults to 5000)

### Docker Compose

Database credentials in [docker-compose.yml](docker-compose.yml) must match `DATABASE_URL` in `.env` files:

- Default: `MYSQL_USER=root`, `MYSQL_PASSWORD=root`, `MYSQL_DATABASE=turborepo`
- Update both docker-compose.yml and .env files together

---

## Common Pitfalls

1. **Missing `.js` extensions**: If you see import errors from Prisma-generated code, run `pnpm db:generate` (NOT just `prisma generate`)
2. **Validation errors ignored**: All route handlers that accept input MUST use `validateSchema` middleware
3. **Unhandled async errors**: All async route handlers MUST be wrapped in `catchAsync`
4. **Generic AbstractCrudService confusion**: Only 4 type params now (Entity, CreateInput, UpdateInput, DTO). Query building is NOT abstracted - implement it in `persistFindMany` with private helpers
5. **Build order issues**: If types are missing, ensure `packages/database` and `packages/domain` are built before `apps/server`

---

## Client App Conventions

### React Router v7 Middleware

**Documentation**: https://reactrouter.com/how-to/middleware

The client uses React Router v7 with middleware support for:

- Authentication checks before route rendering
- Request/response logging and timing
- Error classification and handling
- Context sharing between routes

**Key concepts:**

- **Middleware chain**: Executes parent → child on the way down, child → parent on the way up
- **Server middleware**: Runs on server for document requests and `.data` requests (Framework mode)
- **Client middleware**: Runs in browser for client-side navigations (Framework + Data mode)
- **Context API**: Type-safe context using `createContext()` and `RouterContextProvider`
- **`next()` function**: Calls next middleware in chain or executes route handlers

**Common patterns:**

```typescript
// Authentication middleware
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context }) => {
    const user = await getUserFromSession(request);
    if (!user) throw redirect("/login");
    context.set(userContext, user);
  },
];

// Logging middleware
async function loggingMiddleware({ request }, next) {
  const start = performance.now();
  const response = await next();
  console.log(
    `${request.method} ${request.url} - ${performance.now() - start}ms`
  );
  return response;
}

// Error handling middleware
async function errorMiddleware({ request }, next) {
  const response = await next();
  if (response.status === 404) {
    const redirect = await checkCMSRedirects(request.url);
    if (redirect) throw redirect(redirect, 302);
  }
  return response;
}
```

**Error handling in middleware:**

- Middleware can throw and it will be caught by nearest ErrorBoundary
- `next()` never throws - always returns a Response (even for errors)
- Errors thrown before `next()` bubble to highest route with loader
- Errors thrown after `next()` bubble from the throwing route

**When to use:**

- Use for cross-cutting concerns (auth, logging, timing)
- Use for request/response transformations
- Use when you need to run code before/after handlers
- Prefer over higher-order components for request-level logic

### TanStack Query (React Query)

**Documentation**: https://tanstack.com/query/latest/docs/framework/react/overview

TanStack Query is the server state management library used for data fetching, caching, and synchronization. It handles the complexity of managing remote data.

**Key features:**

- **Automatic caching**: Caches query results with configurable staleTime
- **Deduplication**: Multiple requests for same data coalesced into one
- **Background refetching**: Automatically updates stale data
- **Retry logic**: Configurable retry on failure (server/network errors)
- **Pagination & lazy loading**: Built-in patterns for handling large datasets
- **TypeScript support**: Full type safety for queries and mutations
- **DevTools**: React Query Devtools for debugging in development

**Common patterns:**

```typescript
// Define query options
export const getProductByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["products", id],
    queryFn: () => getApi().then((api) => api.get(`/products/${id}`)),
    staleTime: 60000, // 1 minute
  });

// Use in component
const { data, isPending, error } = useQuery(getProductByIdQueryOptions(id));

// Use in loader
export async function loader({ context }) {
  const queryClient = context.get(queryClientContext);
  return await queryClient.ensureQueryData(getProductByIdQueryOptions(id));
}
```

**Retry configuration** (apps/client/src/lib/react-query.ts):

- Client errors (4xx): No retry, fail immediately
- Server errors (5xx): Retry up to 2 times (exponential backoff)
- Network errors: Retry up to 2 times
- Respects `throwOnError: true` for ErrorBoundary integration

**Error handling:**

- Errors thrown to ErrorBoundary when `throwOnError: true`
- Use with middleware error processing for consistent error handling
- Validates retry eligibility based on status code

---

## Active TODOs

See [todos.js](todos.js) for tracked tasks, including:

- Tune DTO and filter types in ProductService
- Aggregate queries to reduce database roundtrips in `getRelatedProducts`
- Move product route endpoint to category route
- Consider adding config ID to environment variables
