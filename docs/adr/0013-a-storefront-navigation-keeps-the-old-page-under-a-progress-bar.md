# A storefront navigation keeps the old page under a progress bar

Every storefront loader awaits what its route renders: on home the featured product and the
showcase in one `Promise.all`, the category's products, the product, the orders list, and on
checkout the guest-cart sync and then the cart. During a client navigation `PendingOutlet` in the
content layout keeps the old page mounted, shows `ProgressBar` (`role="progressbar"`,
`aria-label="Loading page"`) fixed at the top of the viewport and dims the content between the nav
and the footer to 40% after 150 ms, marked `aria-busy`. It reacts to
`navigation.state === "loading"` with a destination pathname different from the current one, so a
search-param change shows nothing, and it covers the root middleware's `/users/me` wait, because the state is already
`"loading"` while middleware runs. The storefront renders no skeleton: `product-skeleton.tsx` and
`products-list-skeleton.tsx` were deleted and `ui/skeleton.tsx` stays for the admin pages. A full
page load shows `RootHydrateFallback`, because the router runs the loaders before the first render.
The root layout's full-page overlay fires for the logout mutation only. The home loader then calls
`react-dom`'s `preload()` once per art-directed hero source with its `<source>` media query,
`as: "image"` and `fetchPriority: "high"`. The signed-in menu reads the user with
`useSuspenseQuery` behind `AccountMenuFallback`, a disabled, `aria-busy` trigger reading "Hello!"
with no name and labelled "Open user menu" like the loaded one. Settled in the
[#359](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/359) prototype session
([design note](../research/storefront-loading-and-dialogs-design.md)) for
[#358](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/358), built in
[#360](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/360) and
[#361](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/361); the client guide's
[Loaders and boundaries](../../apps/client/README.md#loaders-and-boundaries) section has the
implementation.

## Considered options

Streaming, with loaders that prefetch and a route that renders behind a route-level Suspense
skeleton, was rejected: the root middleware awaits a fresh `/users/me` before any route commits. At
the prototype's 2 s delay, signed in with a cold cache, the loaders took 11 ms and the navigation
still took about 2 s, all of it in the middleware; with the user cached the middleware took about
10 ms. For a signed-in shopper streaming bought no time, and it drew a skeleton.

Awaiting in the loader with the destination's skeleton replacing the page was rejected, and
rejected again after the skeletons were rebuilt to the real pages' geometry, for the old page under
the progress bar.

Leaving things as they were was rejected: the old page sat still until the data arrived, and the
full-page overlay fired on every signed-in navigation because it followed the `/users/me` fetch the
middleware repeats each time.

A five-minute `staleTime` on `/users/me` was rejected. It made signed-in navigations about 2 s
faster at the prototype's delay, but it postpones catching a deactivated account by up to five
minutes. The query keeps `staleTime: Infinity`, the middleware fetches it with `staleTime: 0` on
every navigation, and the progress bar covers that wait.

Reading the pending navigation's location in a page, which the category and product pages did
through `useNavigation`, was rejected in #360: a suspense query for the destination's key
suspended the old page inside the router transition, so the pending state never showed on a
same-route navigation (Headphones to Speakers, product to related product). Pages read
`useParams`.

Preloading more than the hero was deferred. Measured in #361 on the E2E build (desktop Chromium,
guest, local API, medians of seven cold loads) the hero request moved from the `img` to the preload
`link`, `fetchStart` went from 62.7 ms to 57.9 ms, `responseEnd` from 100.4 ms to 96.0 ms, and LCP
stayed at 108 ms. A further preload waits for a measurement that shows a gain.

A skeleton pill and the old spinner were rejected for the signed-in menu in favour of the nameless
greeting. The design note's "Open account menu" was not adopted: the code and four E2E call sites
use "Open user menu", and the fallback carries the same label.

## Consequences

A failed lazy route import ends the pending navigation and renders the route error inside the
content layout, with the navigation and footer still available. Eager pathless parent routes own
the storefront and layout error boundaries: React Router retains a failed lazy match, and its
hydration fallback would otherwise hide a boundary on that same match. A failed content layout
import instead reaches the main fallback. Returning and navigating again retries the import.

A new storefront route (order detail, wishlist, search results) awaits in its loader, reads its
params from `useParams` and gets the pending state with no code of its own. A route whose state
lives in search params, a filter bar or a search box, gets nothing from `PendingOutlet` on a
same-pathname change and shows its own pending state.

A route renders complete, so a slow catalogue API shows the pending navigation instead of partial
content. The section fallbacks under `SafeRenderWithErrorBlock` stay as a safety net, and related
products stay a prefetch behind their section's fallback because they need the product's id. The
checkout page has no loading branch; its first render has the cart.

A suspense query does not suspend on `null`, so `useLogoutUser.onSuccess` calls `markSignedOut`
first, invalidates the cart with `refetchType: "none"` and never writes the logout response into
the user key. Anything that writes `null` into `[USER_QUERY_KEY]` while the status still says
signed in makes the menu read `null.name` and throw to the nav's error boundary. The greeting
fallback is unreachable from a browser: the middleware awaits `/users/me` before the first render,
the per-navigation refetch keeps the existing data so a mounted suspense read never re-suspends,
and a failed fetch with an empty cache throws. It is covered by a Vitest `renderToString` test
(`apps/client/test/account-menu.test.tsx`), not by E2E.

The one-minute default `staleTime` and the hover and focus prefetches resolve a revisited route in
about 10 ms, so an E2E that asserts the pending state starts with a cold cache and holds the API
through the `holdRoute` fixture.
