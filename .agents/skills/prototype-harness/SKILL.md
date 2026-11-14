---
name: prototype-harness
description: "Use for a UI or loading prototype comparing several variants live in the client: a copyable switcher, loading probes and screenshot matrix."
---

Use this harness when a UI or loading question needs several variants compared live in the
client. It is a standalone developer tool; the `mattpocock-skills:prototype` skill can use it independently of its
other steps.

## Copy and configure

Read the [client guide](../../../apps/client/README.md), then copy [templates/](templates/)
into `apps/client/src/components/prototype/<topic>/`. Fill `config.ts`: issue number, named
axes of `{ key, name }` options, and named toggle value lists. Each list is nonempty; its first
option is the default. Use distinct axis/toggle names, reserving `timings` for measurements.
The issue derives `PROTOTYPE-<n>` in sessionStorage and the `PROTOTYPE (#n)` comment marker.
Update the copied README's one-line plan and bar-row table. Wire the compared views with
`useProto()`; loaders and middleware read `proto()`. Changing a choice does not rerun loaders.

## Install checklist

Mark every touch point outside the copied folder, including imports, with the literal
`PROTOTYPE (#n)` from `commentMarker`. `git grep -F 'PROTOTYPE (#n)'` must list the cleanup sites.

- [ ] In `apps/client/src/components/layouts/root-layout.tsx`, import `PrototypeSwitcher` from
      the copied folder and mount `{import.meta.env.DEV && <PrototypeSwitcher />}` beside
      `<Outlet />`. The switcher also returns `null` outside development.
- [ ] For latency, import `installPrototypeLatency` in `apps/client/src/lib/api-client.ts`.
      Inside the lazy instance creation block, call `installPrototypeLatency(apiInstance)`
      under `if (import.meta.env.DEV)` once the instance exists.
- [ ] For navigation measurements, import both probes in `apps/client/src/app/router.tsx`.
      Replace the root middleware list with a development ternary, preserving the existing
      production list and putting `probeStart` first:

```tsx
const rootRoute = {
  // PROTOTYPE (#n)
  middleware: import.meta.env.DEV
    ? [
        probeStart,
        performanceMiddleware,
        resolveCurrentUser(queryClient),
        probeAfterUser(queryClient),
      ]
    : [performanceMiddleware, resolveCurrentUser(queryClient)],
};
```

For a purely visual prototype, keep the switcher and omit the two loading install sites.

## Loading toolbox

Take `latency.ts` when requests must stay pending long enough to compare: define a numeric
`delay` toggle in milliseconds. Take `navigation-probe.ts` to measure the whole navigation and
the wait before loaders, or to compare cache conditions. Define `cache: ["cold", "warm"]` for
query removal; without that toggle the probes only measure.

Fill `destinationKeys(pathname)` before claiming a cold-cache comparison. Map route patterns to
the feature-owned query keys. The #359 mapping covered `/`, `/category/:slug`, `/product/:slug`,
`/account/orders` and `/checkout` using `productKeys`, `orderKeys` and `cartKeys`. The stub returns
`[]` so it cannot evict unrelated data. Removal runs only when the destination pathname changes.

`useProto().timings` exposes `wait` and `total` in milliseconds, without persisting them.
Use the switcher's marked `extras` slot for one-offs: #359 showed a last-navigation readout and
added a `/checkout`-only thank-you button. Add the session's local state alongside that control.

## Screenshot matrix

Use the repo's Node version and installed E2E dependencies. Start the local seeded API and the
Vite dev client (production preview hides the bar). Run:

```sh
node apps/client/src/components/prototype/<topic>/shots.mjs [filter] [origin]
```

The optional first argument is a substring of the full filename stem. The second is the client
origin, defaulting to `http://localhost:5173`; pass `""` as the filter to capture everything on a
custom origin. The script signs in once with the seeded shopper, reuses storageState, and visits
every axis/toggle combination at phone 390×844 and desktop 1440×900 sizes.

Edit only the marked `cases` section for the scenario paths, interactions and readiness checks.
Call `capture()` at the comparison point and optionally `capture("settled")` after its readiness
assertion. Every capture hides the bar and query devtools. Files land in the ignored
`.scratch/prototype-shots/<topic>/` as `<topic>-{variant}-{case}-{viewport}[-settled].png`;
`variant` includes every axis/toggle name and value. A failed seeded login stops the run instead
of retrying against the ten-failures-per-fifteen-minutes IP limit.

## Rules from #359

- Start loading comparisons cold. The one-minute stale time and hover/focus prefetches can
  resolve a revisited route in about 10 ms, hiding the loading state.
- Measure the middleware wait before trusting a streaming variant. The root auth middleware
  awaits `/users/me` before a route commits; that made #359's streaming variant fail to stream.
- Hide development chrome in every screenshot, including the collapsed switcher and query tools.
- Ask whether the whole variant family is acceptable before building it. Skeletons were rejected
  twice in #359.
