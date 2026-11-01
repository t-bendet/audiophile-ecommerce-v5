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
`INVALID_CREDENTIALS` belongs to the login form, which reports it in a toast, and
`FORBIDDEN` does not mean the session is dead. `isCriticalError` matches internal/service
errors and statuses at least 500. The route boundary uses a generic message for those
critical failures.

For truly optional data, choose an explicit non-throwing query and fallback at the
consuming component when appropriate. Wrapping a section in `SafeRenderWithErrorBlock`
alone does not make its 5xx/network failures optional.

## Forms and notifications

Form components own mutation feedback. The
[login](src/features/auth/components/login-form.tsx),
[signup](src/features/auth/components/signup-form.tsx) and
[checkout](src/features/orders/components/checkout-form.tsx) forms validate inputs with the
shared body schema and show local field validation errors inline. Their mutation's
`onError` passes the normalized error to
[`applyServerErrors`](src/lib/errors/form-errors.ts), the only reader of
`AppError.details`, and shows an error toast only when it returns a message:

| Mutation failure                                          | Feedback                                                                                     |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Any code, every detail names a registered field           | The server message under each field, focus on the first in render order, no toast            |
| `VALIDATION_ERROR` with an unmatched detail or no details | Matched details still inline; the toast says "We couldn't accept this form. Please refresh…" |
| Any other code with an unmatched detail or no details     | Matched details still inline; the toast shows the normalized error's message                 |

A detail matches when its `path` starts with `"body"` and the rest, joined with `"."`, is a
registered field name such as `shippingAddress.zipCode`. Details are mapped for any error code,
not only `VALIDATION_ERROR`: a taken email at signup is a `DUPLICATE_ENTRY` with a detail at
`["body", "email"]`, so it shows under the email field. Unmatched validation messages are written
for developers and never shown; every other code's message is written for shoppers and is the
toast fallback. Server field errors use the `onSubmit` error key, so editing the field clears
them like a client error. Route and feature boundaries never see mutation errors. The decision is
recorded in
[ADR 0006](../../docs/adr/0006-server-validation-errors-belong-to-the-form.md). There is no
global rule that all 4xx responses appear inline or all 5xx responses produce a toast.

Keep feedback at the feature that owns the action. Query retry classification does not
display an error, and adding a transport-level toast would duplicate feedback from
forms or boundaries.

Toasts are [Sonner](https://sonner.emilkowal.ski/): call `toast.success(title, { description })`
or `toast.error(title, { description })` imported from `sonner`; no hook or wrapper module is
involved, so mutation callbacks can toast directly. [`AppProvider`](src/app/provider.tsx) mounts
the single [`Toaster`](src/components/ui/sonner.tsx), which carries the palette and font
overrides through `toastOptions.classNames`.

## Router middleware

[`performanceMiddleware`](src/app/middleware/performance.ts) is the only registered
middleware. It measures navigation around `next()` and logs duration in development.
Authentication, error normalization, and retry behavior remain in the loaders, query
configuration, and components described above. The
[historical middleware proposal](docs/error-middleware-proposal.md) records earlier
ideas; it is not the current implementation or an approved migration plan.

## Page metadata

A route declares its document metadata by rendering
[`Metadata`](src/components/seo/metadata.tsx) with its title, description and Open Graph image;
React 19 hoists those tags into the head. The optional `structuredData` prop takes a schema.org
object built by [`structured-data.ts`](src/components/seo/structured-data.ts) and emits it as the
page's one `application/ld+json` script: the product route passes `productStructuredData` and
the home route `organizationStructuredData`. React does not hoist inline scripts, so the script
renders where the route renders `Metadata` and is replaced along with the route's other props on
navigation. [`public/robots.txt`](public/robots.txt) is static; the sitemap is a
[server route](../server/README.md#request-lifecycle).

## Verification

[`test/errors.test.ts`](test/errors.test.ts) covers nested server-error extraction,
consistent validation status, and the distinction between expired sessions and rejected
login attempts. [`test/form-errors.test.ts`](test/form-errors.test.ts) drives
`applyServerErrors` against a headless TanStack form with a stubbed `document`. Run the
client suite with `pnpm --filter client test` after its workspace dependencies are built,
or use root `pnpm test` for dependency ordering. For browser coverage, follow the
[E2E guide](../e2e/README.md); for the remaining checks, see
[verification](../../docs/agents/verification.md).

`pnpm format:check` sorts Tailwind classes with the `tailwindStylesheet` entry in
[`.prettierrc`](.prettierrc); without it the plugin reuses whichever Tailwind context the
first formatted file produced, so the sort changes with the file set.
