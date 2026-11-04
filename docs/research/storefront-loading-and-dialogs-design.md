# Storefront loading states and dialogs design note

Decided 2026-11-03 in the prototype session for [#359](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/359).
This is the document #360, #361 and #362 follow. The prototype itself is the primary source: tag
[`prototype-359`](https://github.com/t-bendet/audiophile-ecommerce-v5/tree/prototype-359),
on the real storefront routes, run with `pnpm dev` and opened at `/?delay=2000`. Its README explains the
floating bar. It is throwaway code and is never merged.

## Verdict

**No skeletons anywhere in the storefront.** Every route uses loading variant **A**: the loader awaits
its data while the old page stays on screen, dimmed under a progress bar. The account menu uses
fallback **B**, a nameless greeting. The dialogs use variant **A**: the mobile menu and the mini-cart as
sheets below the nav, and the thank-you centred, all on one Radix Dialog primitive.

Rejected: loading **0** (today: the old page sits still, and a full-page overlay fires on every
signed-in navigation); loading **B** (loaders prefetch and the route streams behind a route-level
Suspense skeleton); loading **C** (loaders await and the destination's skeleton replaces the page
during the wait). C was rejected even after its skeletons were rebuilt to match the real pages.

## Decisions

### Per route: home, category, product, account orders, checkout

Every loader awaits what its route reads, and the route renders complete. A navigation keeps the old
page mounted until the loaders resolve. Two things show during that wait:

- **A progress bar**, shown at once: a fixed 4px track at the top of the viewport (`z-60`), with an
  orange `primary-500` segment sliding across it. It has `role="progressbar"` and
  `aria-label="Loading page"`.
- **A dim on the old page**: the content between the nav and the footer fades to 40% opacity after
  150ms, over 300ms, and is marked `aria-busy`. A fast or prefetched navigation finishes before the
  dim starts. The nav and footer stay at full strength.

The pending state is `navigation.state === "loading"` with a destination pathname different from the
current one, so a search-param change on the same page shows nothing. The wrapper goes around the
content layout's `<Outlet />`. The pending state also covers the root middleware's `/users/me` wait,
because `navigation.state` is already `"loading"` while middleware runs.

What each loader awaits:

| Route          | Loader                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| home           | the featured product and the showcase in parallel, then preloads the hero (next section)                                   |
| category       | the category's products                                                                                                    |
| product        | the product; related products need its id, so they stay a prefetch behind their section's existing fallback below the fold |
| account orders | the orders list                                                                                                            |
| checkout       | the guest-cart sync, then the cart, so the page's loading-spinner branch no longer shows on a navigation                   |

A full page load is already covered by `RootHydrateFallback`, because the router runs the loaders
before the first render. No route needs its own fallback. The section fallbacks under
`SafeRenderWithErrorBlock` stay as they are, as a safety net.

The root layout's full-page overlay stops following the `/users/me` fetch and stays for logout only.

The dead `product-skeleton.tsx` and `products-list-skeleton.tsx` are deleted. `ui/skeleton.tsx` stays,
because the admin pages use it.

### Home hero

The home loader awaits the featured product and preloads the hero, so the hero paints without a
spinner or a placeholder. It calls `preload()` from `react-dom` once for each of the three
art-directed sources, each with its own `<source>` media query:

- mobile: `(max-width: 767px)`
- tablet: `(min-width: 768px) and (max-width: 1023px)`
- desktop: `(min-width: 1024px)`

All three use `as: "image"` and `fetchPriority: "high"`. The showcase is awaited in the same
`Promise.all`, so it adds no wait of its own. Rejected: streaming the hero behind a skeleton.

### Signed-in menu

While the user loads, the menu trigger renders as a disabled, `aria-busy` button reading "Hello!"
without the name, with the chevrons icon, at 60% opacity. Its accessible name stays "Open account menu".
When the user resolves, the name fills in at the same position. This replaces the raw "Loading..."
text in `logged-in-user-dropdown.tsx` and the spinner fallback the nav bar wraps around the dropdown.

The dropdown reads the user through `useSuspenseQuery`, with the greeting as its Suspense fallback.
This switch carries the logout hazard recorded on
[#361](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/361#issuecomment-6601886399), which
#361 fixes.

Rejected: **A**, a skeleton pill (no skeletons); **C**, today's spinner.

### `/users/me` stale time

The `/users/me` stale time is unchanged. The root middleware keeps refetching the user on every
navigation, so a deactivated account is caught on the next click. The progress bar covers the wait.
Rejected: a five-minute stale time. It made signed-in navigations about 2s faster at the prototype's
2s delay, but it postpones deactivation detection by up to five minutes.

### One dialog primitive

One primitive on `@radix-ui/react-dialog` replaces three mechanisms:

- `ui/dialog`, which today serves the mobile menu and the admin account panel
- `ui/drawer`, the `vaul` mini-cart
- the inline thank-you

`vaul` leaves the client along with its swipe-to-dismiss. The primitive takes a `placement` and ships
only the three placements in use:

| Surface     | Placement and behaviour                                                                                                                                                                                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mobile menu | `sheet-top`, `belowNav`: full width, drops from under the nav, `rounded-b-lg`, scrolls within `100dvh` less the nav. The category nav list is the content. The title "Main menu" is visually hidden, there is no close button, and choosing a category closes it.                                                                                |
| Mini-cart   | `sheet-top-end`, `belowNav`: a `max-w-sm` panel 1.5rem under the nav, aligned to the container's right edge, `rounded-lg`, fading and sliding in. The title is "cart (n)". It holds the items with quantity controls, then the total, "Go to Checkout" and a "Continue Shopping" button that closes it. Its loading state keeps today's spinner. |
| Thank-you   | `centred`, no offset: `max-w-lg`, zoom and fade. Title "Thank you for your order", the confirmation icon, the order id with the payment instructions and the confirmation email, the first item with "and n other item(s)" beside the grand total, then "View your orders" and "Back to home". A click outside does not dismiss it.              |

The overlay is `bg-neutral-900/50` and covers the whole viewport by default. `belowNav` is opt-in: it
adds `top-(--nav-bar-height)` to the overlay and the panel. The admin account panel does not set it,
so its overlay covers the full viewport. Today it inherits the storefront's hardcoded offset and leaves
a nav-height strip uncovered.

The phone E2E names stay: the "Open main menu" button, the "Main menu" dialog, the "Open cart" button
and the "cart (n)" dialog.

Rejected: **B**, bottom drawers with a drag handle, the mini-cart and thank-you centred from `md` up;
**C**, side panels from the start and end edges with a full-screen thank-you.

## Reference implementation

The chosen variants already exist as working code on the prototype branch. Lift them, minus the
prototype's variant switching:

- [`pending.tsx`](https://github.com/t-bendet/audiophile-ecommerce-v5/blob/prototype-359/apps/client/src/components/prototype/storefront-loading/pending.tsx): `ProgressBar`, and the `loading === "A"` branch of
  `PrototypeOutlet`, which holds the pending condition and the dim wrapper.
- [`dialog.tsx`](https://github.com/t-bendet/audiophile-ecommerce-v5/blob/prototype-359/apps/client/src/components/prototype/storefront-loading/dialog.tsx): the primitive, with the `belowNav` prop and the overlay. Keep only the
  `sheet-top`, `sheet-top-end` and `centred` placements.
- [`dialogs.tsx`](https://github.com/t-bendet/audiophile-ecommerce-v5/blob/prototype-359/apps/client/src/components/prototype/storefront-loading/dialogs.tsx): the three surfaces as placed by `PLACEMENTS.A`. The mini-cart's
  loading branch there draws skeletons; ship today's spinner instead.
- [`menu-fallback.tsx`](https://github.com/t-bendet/audiophile-ecommerce-v5/blob/prototype-359/apps/client/src/components/prototype/storefront-loading/menu-fallback.tsx): the `menu === "B"` branch is the greeting fallback.
- [`app/routes/home/index.tsx`](https://github.com/t-bendet/audiophile-ecommerce-v5/blob/prototype-359/apps/client/src/app/routes/home/index.tsx): the loader's await of
  the featured product and its three `preload()` calls. Add the showcase to the same `Promise.all`.

## Findings from the prototype

- **Streaming does not stream for a signed-in shopper.** The root middleware
  (`apps/client/src/app/middleware/auth.ts`) awaits a fresh `/users/me` before any route commits. At a
  2s delay, signed in, with a cold cache:
  - 0, A and C: loaders took about 2s and the navigation about 4s in total.
  - B: loaders took 11ms, but the navigation still took about 2s, all of it in the middleware.

  With `/users/me` cached, the middleware took about 10ms. This is part of why B lost.

- **Today's full-page overlay fires on every signed-in navigation**, because it follows the
  `/users/me` fetch, which the middleware refetches each time.
- **Caching hides loading states.** The one-minute `staleTime` in `src/lib/react-query.ts` and the
  hover and focus prefetches resolve a revisited route in about 10ms. Those prefetches are on the
  category nav list, the nav links, the showcase, the product actions and the related products. An E2E
  that asserts a pending state must start with a cold cache and delay the API through a Playwright
  route.
- **The thank-you sits over an empty cart.** The server clears the cart when the order is placed
  (`apps/server/src/services/order.service.ts`), so whatever the checkout page shows behind the dialog
  is the empty state. Blocking a click outside keeps a stray tap from dropping the shopper on that page.
- **Some storefront headings are white on white.** The storefront `<body>` defaults to white text, as
  the admin and auth notes found. The "Account Settings" heading in the user area layout and the "Your
  cart is empty" heading on checkout set no colour and are invisible.
