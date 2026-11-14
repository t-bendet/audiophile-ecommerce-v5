# Prototype harness

Repo facts for the `t-bendet-skills:prototype-harness` skill. The skill holds the process and the
templates; read the [client guide](../../apps/client/README.md) before wiring a variant.

## Install sites

| Name             | Path                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Prototype folder | `apps/client/src/components/prototype` (absent between prototypes; the next one creates it)           |
| Root layout      | `apps/client/src/components/layouts/root-layout.tsx`                                                  |
| API client       | `apps/client/src/lib/api-client.ts`: `apiInstance`, created lazily inside `getApi()`                  |
| Router           | `apps/client/src/app/router.tsx`: the root route's `middleware` list inside `createAppRouter`         |
| Query client     | Created in `apps/client/src/app/provider.tsx`; `createAppRouter(queryClient)` already has it in scope |

`resolveCurrentUser(queryClient)` blocks the route commit: it awaits `/users/me`. `probeAfterUser`
follows it, and `performanceMiddleware` stays ahead of it:

```tsx
middleware: import.meta.env.DEV
  ? [probeStart, performanceMiddleware, resolveCurrentUser(queryClient), probeAfterUser(queryClient)]
  : [performanceMiddleware, resolveCurrentUser(queryClient)],
```

Call `installPrototypeLatency(apiInstance)` inside the lazy creation block of `getApi()`, once the
instance exists.

The admin list routes own query-string parameters: `status`, `paymentStatus`, `orderId`,
`customerEmail`, `userId`, `page`, `search`, `role` and `period`; sign-in owns `redirectTo` and
`reason`. Name no axis or toggle after one of them.

## Query keys

The queries each route's loader awaits or prefetches, as the narrowest call in the key file. Key
files: `productKeys` in `apps/client/src/features/products/api/product-keys.ts`, `orderKeys` in
`features/orders/api/order-keys.ts`, `cartKeys` in `features/cart/api/cart-keys.ts`,
`adminOrderKeys` in `features/admin/orders/api/admin-order-keys.ts`, `adminUserKeys` in
`features/admin/users/api/admin-user-keys.ts`, `adminStatsKeys` in
`features/admin/stats/api/admin-stats-keys.ts`, and `configKeys` in
`features/admin/homepage/api/get-admin-config.ts`.

| Route pattern                | Query keys                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/`                          | `productKeys.featuredProductDetail()`, `productKeys.showCaseProductsList()`                                      |
| `/category/:categoryName`    | `productKeys.productsByCategoryList(categoryName)`                                                               |
| `/product/:productSlug`      | `productKeys.detail(productSlug)`, `productKeys.relatedProductsList(id)` with the loaded product's `id`          |
| `/checkout`                  | `cartKeys.detail()`; the loader's key appends `true`, the signed-in cart                                         |
| `/account/orders`            | `orderKeys.list(filters)` with the default page and limit of `listOrdersQueryOptions()`                          |
| `/account/orders/:orderId`   | `orderKeys.detail(orderId)`                                                                                      |
| `/admin`, `/admin/stats`     | `adminStatsKeys.period(period)`, `period` read from the query string by `readPeriod`                             |
| `/admin/orders`              | `adminOrderKeys.list(filters)`, `filters` read from the query string by `readOrderFilters`                       |
| `/admin/orders/:orderId`     | `adminOrderKeys.detail(orderId)`                                                                                 |
| `/admin/users`               | `adminUserKeys.list(filters)`, `filters` read from the query string by `readUserFilters`                         |
| `/admin/users/:userId`       | `adminUserKeys.detail(userId)`, `adminOrderKeys.list({ userId })`, `adminUserKeys.list(ACTIVE_ADMINS_FILTERS)`   |
| `/admin/products`            | `productKeys.list(pageQuery(page))`, `page` read from the query string by `readPage`; the categories query below |
| `/admin/products/:productId` | `productKeys.detail(productId)`; the categories query below                                                      |
| `/admin/homepage`            | `configKeys.detail()`, `productKeys.list({ limit: "100" })`                                                      |

These paths load no query of their own: `/account` (redirects to `/account/profile`),
`/account/profile`, `/account/security`, `/auth/login`, `/auth/signup`, `/auth/forgot-password`
and `/auth/reset-password`.

Every route shares three queries that have no key file. The root loader prefetches
`getCategoriesQueryOptions().queryKey` (`features/categories/api/get-categories.ts`). The root
middleware reads `getAuthStatusQueryOptions().queryKey` and, for a signed-in session, refetches
`getUserQueryOptions().queryKey` on every navigation whatever the cache holds (both in
`apps/client/src/lib/auth/index.tsx`).

`routeKeys` holds fixed keys per pattern, so a call that takes a route param, a query-string value
or the loaded product's `id` needs that value written in for the page under test. Without it, the
next call up (`details()`, `lists()`) covers the route and also clears its siblings.

## Screenshot run

- Dev origin: `http://localhost:5173` (`VITE_APP_PORT` moves it; pass the printed origin as the
  script's second argument).
- Playwright resolves from: `apps/e2e/package.json`.
- Sign-in: `POST /api/v1/auth/login` with the seeded shopper's email and password from
  `packages/database/src/seed/users.seed.ts`. Ten failed logins in fifteen minutes lock the IP out.
- Output folder: `.scratch/prototype-shots` (git-ignored).
- Before running: `pnpm dev` from the repo root starts the database, the seeded API and the Vite
  client. Use the Node in `.nvmrc`.

## Lessons

From #359:

- The one-minute stale time and the hover and focus prefetches resolve a revisited route in about
  10 ms, which hides the loading state.
- The root auth middleware awaits `/users/me` before a route commits; that kept #359's streaming
  variant from streaming.
- Skeletons were rejected twice: ask whether the whole variant family is acceptable before
  building it.
- The switcher's `extras` slot held a last-navigation readout and a `/checkout`-only thank-you
  button.
