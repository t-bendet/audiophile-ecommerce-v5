# Client implementation guide

Read this before changing client data fetching, routing, forms, or error handling.
Environment variables are documented in [`.env.example`](.env.example); shared request
and response contracts follow the [domain conventions](../../docs/agents/domain.md).

## Server state and HTTP

Use TanStack Query for server state, with query-option factories and feature-owned query
keys. [`get-product.ts`](src/features/products/api/get-product.ts) is the maintained
example: a factory supplies the key and query function, the function passes the query's
abort signal to Axios, and the response is parsed with its `@repo/domain` schema.

All HTTP requests use [`getApi()`](src/lib/api-client.ts). It synchronously returns the
lazy Axios instance after environment initialization, sets JSON accept headers and
credentials, and rejects errors unchanged. The interceptor neither normalizes errors nor
shows notifications. API consumers parse the response envelope rather than assuming
Axios has unwrapped `response.data` for them.

[`AppProvider`](src/app/provider.tsx) owns the shared `QueryClient`.
[`queryConfig`](src/lib/react-query.ts) sets a one-minute stale time, disables window-focus
refetching, and uses `processAxiosError` to decide retries: classified 4xx responses and
client-side Zod errors do not retry; other failures retry up to twice. That classification
does not replace the error held by the query. Queries throw to boundaries by default,
except the explicit `optional-data` key convention; an individual query may override
its options. Notifications are chosen by the consuming feature, not a global query
error handler.

## Loaders and boundaries

Route modules export `clientLoader(queryClient)` when they need a loader; the adapter in
[`router.tsx`](src/app/router.tsx) supplies the same client used by components. For data
required to render the route, await `ensureQueryData` in the loader and let failures reach
the route boundary. The [product loader](src/app/routes/product/index.tsx) demonstrates
required product data and separate related-product prefetching. Prefetching warms the
cache; it is not a required-data success check.

Use [`normalizeError`](src/lib/errors/errors.ts) where an error becomes a presentation
or control-flow decision. It preserves an existing `AppError`, reads server errors from
`AxiosError.response.data.error`, maps network failures to `EXTERNAL_SERVICE_ERROR`, and
maps local Zod errors to `VALIDATION_ERROR` with structured details. Unknown failures
become `INTERNAL_ERROR`. A malformed/unrecognized HTTP error envelope falls back to an
internal error rather than necessarily preserving the HTTP response's status.

| Failure context                     | Current handling                                                                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route loader or route rendering     | [`RouteErrorBoundary`](src/components/errors/route-error-boundary.tsx) handles Router response errors directly and normalizes other errors         |
| Feature rendering or Suspense query | [`SafeRenderWithErrorBlock`](src/components/errors/safe-render-with-error-block.tsx) combines loading fallback, query reset, and an error boundary |
| Dead session                        | Both boundaries use [`RedirectToLogin`](src/components/errors/redirect-to-login.tsx), which marks cached auth state signed out before navigating   |
| Recoverable feature error           | `SafeRenderWithErrorBlock` renders `ErrorBlock` with a reset action                                                                                |
| Critical feature error              | The feature boundary rethrows it to the route boundary; it is not isolated inline                                                                  |
| Application-level failure           | [`MainErrorFallback`](src/components/errors/main.tsx) supplies the outer fallback                                                                  |

`isAuthError` matches `UNAUTHORIZED`, `INVALID_TOKEN`, and `TOKEN_EXPIRED`.
`INVALID_CREDENTIALS` belongs to the login form, and `FORBIDDEN` does not mean the session
is dead. `isCriticalError` matches internal/service errors and statuses at least 500.
The route boundary uses a generic message for those critical failures.

For truly optional data, choose an explicit non-throwing query and fallback at the
consuming component when appropriate. Wrapping a section in `SafeRenderWithErrorBlock`
alone does not make its 5xx/network failures optional.

## Forms and notifications

Form components own mutation feedback. Normalize the error in the mutation's `onError`
before using its semantic code, message, or structured `details`. Current
[login](src/features/auth/components/login-form.tsx) and
[signup](src/features/auth/components/signup-form.tsx) forms validate inputs with the
shared body schema, show local field validation errors inline, and show mutation
failures through a destructive toast. There is no global rule that all 4xx responses
appear inline or all 5xx responses produce a toast.

Keep feedback at the feature that owns the action. Query retry classification does not
display an error, and adding a transport-level toast would duplicate feedback from
forms or boundaries.

## Router middleware

[`performanceMiddleware`](src/app/middleware/performance.ts) is the only registered
middleware. It measures navigation around `next()` and logs duration in development.
Authentication, error normalization, and retry behavior remain in the loaders, query
configuration, and components described above. The
[historical middleware proposal](docs/error-middleware-proposal.md) records earlier
ideas; it is not the current implementation or an approved migration plan.

## Verification

[`test/errors.test.ts`](test/errors.test.ts) covers nested server-error extraction,
consistent validation status, and the distinction between expired sessions and rejected
login attempts. Run the client suite with `pnpm --filter client test` after its workspace
dependencies are built, or use root `pnpm test` for dependency ordering. For browser
coverage, follow the [E2E guide](../e2e/README.md); for the remaining checks, see
[verification](../../docs/agents/verification.md).

`pnpm format:check` sorts Tailwind classes with the `tailwindStylesheet` entry in
[`.prettierrc`](.prettierrc); without it the plugin reuses whichever Tailwind context the
first formatted file produced, so the sort changes with the file set.
