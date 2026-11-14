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

| Route pattern                                 | Query keys                                                |
| --------------------------------------------- | --------------------------------------------------------- |
| `/`, `/category/:categoryName`                | `productKeys` in `apps/client/src/features/products/api/` |
| `/product/:productSlug`                       | `productKeys`                                             |
| `/account/orders`, `/account/orders/:orderId` | `orderKeys` in `apps/client/src/features/orders/api/`     |
| `/checkout`                                   | `cartKeys` in `apps/client/src/features/cart/api/`        |

Pick the narrowest key call each route's loader uses; the admin features keep their own key files
beside their `api/` folders.

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
