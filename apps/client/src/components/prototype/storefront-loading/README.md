# Storefront loading states and dialogs prototype (#359)

Variants live on the real storefront routes, not on a throwaway page. Loading states only show
against real data and real navigation. A floating bar picks the variants. The choice lives in a module
store, since loaders run outside React, and is mirrored into the URL as `?loading=`, `?dialog=`,
`?menu=`, `?delay=`, `?auth=` and `?cache=`. The bar writes them with `history.replaceState` on every click and
after every navigation, so no loader re-runs. A URL is shareable and survives a reload; on a full
load the URL wins over the `sessionStorage` copy.

Run `pnpm dev` (MongoDB, API and client) and open <http://localhost:5173/?delay=2000>. Sign in as
`doe@example.com` / `11111111` for the account orders page and checkout. Every API request waits
the bar's delay first (`latency.ts`), so pending states last long enough to judge.

| Bar row     | Keys                     | What it changes                                                                                                                                                                                                                                                      |
| ----------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| loading     | 0, A, B, C (← / → cycle) | 0: today. A: loaders await, old page dimmed with a progress bar. B: loaders prefetch, route-level Suspense skeleton. C: loaders await, destination skeleton swapped in during the wait                                                                               |
| dialogs     | A, B, C                  | A: menu and mini-cart as sheets below the nav, thank-you centred. B: bottom drawers, mini-cart and thank-you centred from `md`. C: side panels, full-screen thank-you                                                                                                |
| menu        | A, B, C, hold            | The account menu's fallback: A skeleton pill, B nameless greeting, C today's spinner; "hold" pins it                                                                                                                                                                 |
| delay       | 0, 800, 2000             | Milliseconds added before every API request                                                                                                                                                                                                                          |
| `/users/me` | fresh, cached            | fresh: the root middleware refetches the user on every navigation, as today. cached: a five-minute stale time                                                                                                                                                        |
| cache       | cold, warm               | cold (default): each navigation first drops the destination route's queries, including anything a hover or focus prefetch fetched, so every visit shows its loading state. warm: today, where a route seen in the last minute (`staleTime`) or hovered opens at once |
| last nav    | (readout)                | The last navigation's time waiting on `/users/me` in the root middleware, in loaders, and in total, in ms (`navigation-probe.ts`)                                                                                                                                    |
| thank-you   | (on `/checkout`)         | Opens the thank-you dialog over the page with a stub order built from the cart; nothing is placed                                                                                                                                                                    |

The bar is mounted in the root layout, so it shows on every route, the auth pages included.
Nothing in it places an order or clears the cart; placing a real order at checkout does.

Variants A to C also drop the root layout's full-page overlay for the user fetch and keep it for
logout. The home loader in A and C awaits the featured product and preloads each of the hero's three
art-directed sources with its `media` query.

Throwaway code. It lives on the `prototype/359-storefront-loading-and-dialogs` branch and is never
merged to `main`; the verdict goes in `docs/research/storefront-loading-and-dialogs-design.md`.
