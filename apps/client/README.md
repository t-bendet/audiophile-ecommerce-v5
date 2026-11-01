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
the route boundary. Loaders never fetch the signed-in user: the
[root middleware](#router-middleware) resolves it once per navigation, and a loader that needs
it reads `context.get(currentUserContext)`. The [product loader](src/app/routes/product/index.tsx) demonstrates
required product data and separate related-product prefetching. Prefetching warms the
cache; it is not a required-data success check.

Use [`normalizeError`](src/lib/errors/errors.ts) where an error becomes a presentation
or control-flow decision. It preserves an existing `AppError`, reads server errors from
`AxiosError.response.data.error`, maps network failures to `EXTERNAL_SERVICE_ERROR`, and
maps local Zod errors to `VALIDATION_ERROR` with structured details. Unknown failures
become `INTERNAL_ERROR`. A malformed/unrecognized HTTP error envelope falls back to an
internal error rather than necessarily preserving the HTTP response's status.

| Failure context                     | Current handling                                                                                                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route loader or route rendering     | [`RouteErrorBoundary`](src/components/errors/route-error-boundary.tsx) handles Router response errors directly and normalizes other errors                                   |
| Feature rendering or Suspense query | [`SafeRenderWithErrorBlock`](src/components/errors/safe-render-with-error-block.tsx) combines loading fallback, query reset, and an error boundary                           |
| Dead session                        | Both boundaries use [`RedirectToLogin`](src/components/errors/redirect-to-login.tsx), which marks cached auth state signed out before navigating                             |
| Not-found response                  | `RouteErrorBoundary` and [`RootErrorBoundary`](src/components/errors/root-error-boundary.tsx) render [`NotFound`](src/components/errors/not-found.tsx), the `*` route's page |
| Recoverable feature error           | `SafeRenderWithErrorBlock` renders `ErrorBlock` with a reset action                                                                                                          |
| Critical feature error              | The feature boundary rethrows it to the route boundary; it is not isolated inline                                                                                            |
| Application-level failure           | `RootErrorBoundary` renders [`MainErrorFallback`](src/components/errors/main.tsx) for anything but a not-found response                                                      |

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

The root route in [`router.tsx`](src/app/router.tsx) registers two middlewares, in this order:

1. [`performanceMiddleware`](src/app/middleware/performance.ts) measures the navigation around
   `next()` and logs the duration in development. It runs first so the user lookup below is
   inside the measured time.
2. `resolveCurrentUser` in [`auth.ts`](src/app/middleware/auth.ts) decides once per navigation
   who the shopper is. It reads the cached `/auth/status` query through the shared `QueryClient`,
   fetches `/users/me` afresh when the status says signed in, and stores `UserDTO | null` under
   the typed `currentUserContext` key. A `/users/me` request the server rejects as
   unauthenticated marks the cached status signed out and resolves a guest; any other failure
   keeps the user already in the cache, and the components that render the user surface it. The
   [auth layout](src/components/layouts/auth-layout.tsx) loader reads the key to send a signed-in
   user away from the login and signup pages.

A route group opts in by listing guards in its route's `middleware` array, which run after the
root's:

- `requireAuth` redirects a guest to login with the current URL as `redirectTo`, so signing in
  lands on the page they asked for. Checkout and the account group use it.
- `requireRole(role)` throws a 404 response for a signed-in user whose role differs; the
  matching role passes through. List it after `requireAuth`, since alone it answers a guest with
  not-found as well. The [admin dashboard](#admin-dashboard) group is its consumer.
  [ADR 0008](../../docs/adr/0008-a-route-the-role-cannot-reach-is-not-found.md) records why a
  role mismatch is not found on the client while the API answers 403.

A guarded group needs its own `errorElement`. React Router bubbles an error thrown before
`next()` to the shallowest route that is loading in that navigation: the group's boundary on a
client-side navigation, the root's on a full page load. Both boundaries render `NotFound` for a
404 response, so a wrong role shows the same page as an unknown URL, with no redirect. Redirects
thrown by middleware are followed in either case.

Components cannot read the router context, so they keep reading the cached queries:
`useIsAuthenticated` in [`lib/auth`](src/lib/auth/index.tsx) for the cart hooks, and
`getUserQueryOptions` where the user is rendered. Error normalization and retry behavior stay in
the query configuration and boundaries described above. The
[historical middleware proposal](docs/error-middleware-proposal.md) records earlier ideas; it
is not the current implementation.

## Admin dashboard

`/admin` is a lazy-loaded route group registered in [`router.tsx`](src/app/router.tsx) as a
sibling of the storefront's content layout, so it renders none of the storefront header, footer,
mini-cart or cart drawer. Its code lives under `src/features/admin/`, with a sub-folder per slice
(`orders`, `users`, `products`, `homepage`, `stats`) created as that slice lands. The group lists
`requireAuth` then `requireRole("ADMIN")` in its `middleware` and owns a `RouteErrorBoundary`, so
a guest is sent to login with `/admin` as the return URL and a signed-in shopper sees the not-found
page ([ADR 0008](../../docs/adr/0008-a-route-the-role-cannot-reach-is-not-found.md)). Anything
visual follows the [design note](../../docs/research/admin-dashboard-design.md).

[`AdminLayout`](src/features/admin/components/admin-layout.tsx) is the shell: from `md` up a fixed
left sidebar with the logo, the section entries and the signed-in admin's name and email, and below
`md` a fixed bottom tab bar with the same entries as icon and label, with no drawer. The white
header carries the active section's label as the page title. Both navigations render
[`ADMIN_SECTIONS`](src/features/admin/sections.ts), and the layout renders `Metadata` with
`noIndex` for every admin route, so a page renders its own `Metadata` only to change the title.
[`public/robots.txt`](public/robots.txt) disallows `/admin/` as well.

A slice adds a section in two places:

1. Append `{ label, href, icon }` to `ADMIN_SECTIONS`; the sidebar entry, the tab bar entry and the
   header title follow. Only the dashboard root sets `end`, so a nested URL such as a detail page
   keeps its list's entry active.
2. Add the route as a child of the admin group in `router.tsx`, lazy-loading its module from the
   slice's folder through `convert` like every other route, with `clientLoader` for required data
   and `SafeRenderWithErrorBlock` for inline feature errors as the
   [boundaries table](#loaders-and-boundaries) describes.

The [logged-in user dropdown](src/components/layouts/content-layout/nav-bar/user-dropdown/logged-in-user-dropdown.tsx)
shows an Admin item linking to `/admin` when the rendered user's role is `ADMIN` and nothing for a
shopper. The first admin account comes from the database's `db:role` script
([roles](../../packages/database/README.md#roles)), not from any page.

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
login attempts. [`test/auth-middleware.test.ts`](test/auth-middleware.test.ts) drives a memory
router through the auth middleware with only the HTTP client mocked: pass-through, redirect to
login with the return URL, not-found for the wrong role, a session that died, and a role change
seen on the next navigation. [`test/admin-sections.test.ts`](test/admin-sections.test.ts) checks
the admin section lookup behind the header title and the active entry.
[`test/form-errors.test.ts`](test/form-errors.test.ts) drives
`applyServerErrors` against a headless TanStack form with a stubbed `document`. Run the
client suite with `pnpm --filter client test` after its workspace dependencies are built,
or use root `pnpm test` for dependency ordering. For browser coverage, follow the
[E2E guide](../e2e/README.md); for the remaining checks, see
[verification](../../docs/agents/verification.md).

`pnpm format:check` sorts Tailwind classes with the `tailwindStylesheet` entry in
[`.prettierrc`](.prettierrc); without it the plugin reuses whichever Tailwind context the
first formatted file produced, so the sort changes with the file set.
