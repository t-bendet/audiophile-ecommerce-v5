# e2e

The Playwright smoke suite. A real Chromium drives the built client and the compiled server against
a dedicated seeded database, so a green run says the join between the two apps works: the Vite
proxy, the auth cookie, cart sync after login, the routes the router actually mounts. It is the one
thing in the repo that tests the artifacts that ship rather than a dev server.

Nothing here imports from the monorepo. The workspace has no `test` script either, so `pnpm test`
keeps running Vitest without Docker or browser servers; server tests boot an in-memory database.

## Running it

```bash
pnpm test:e2e                               # the whole thing, from the repo root
pnpm --filter e2e run e2e:ui                # UI mode, against servers it starts
pnpm --filter e2e run e2e cart.spec.ts      # one file
pnpm --filter e2e run e2e --project=mobile  # only the phone specs
pnpm --filter e2e run e2e:report            # open the HTML report of the last run
```

`pnpm test:e2e` starts the Docker database, seeds and pushes `audiophile-e2e`, builds both apps
through Turbo and runs the suite. The filtered forms skip the database work, so run the root script
at least once first — and again whenever a test has left the database somewhere you did not intend.

The seed runs **before** the push, and the order is not interchangeable: `db:seed` drops the
database, indexes and all, and the push is what rebuilds them. `Cart.userId` has to be unique while
the suite runs, because `getOrCreateCart` finds-then-creates and two concurrent page loads would
otherwise leave two carts behind — after which the next push cannot rebuild the index and every
rerun fails on `E11000 ... Cart_userId_key`.

## Ports and database

| What             | Where                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| Server (built)   | `http://localhost:8001`, readiness on `/api/v1/health`                          |
| Client (preview) | `http://localhost:4173`, `baseURL` for every spec                               |
| Database         | `mongodb://localhost:27017/audiophile-e2e?replicaSet=rs0&directConnection=true` |

Both servers come from Playwright's `webServer` array and are never reused, so a run cannot
silently test a `pnpm dev` session: that one holds 8000, 5173 and the `audiophile` database, and
none of the three is touched here. `audiophile-test` belongs to `pnpm test:db` and is not touched
either. A local run and the CI job agree on all of it.

The server runs with `NODE_ENV=test`, which also stands the rate limiters down, so no spec can trip
a 429 no matter how many retries it takes. The vitest suite owns that behaviour.

## Fixtures

Every spec imports `test` and `expect` from `tests/fixtures.ts`, never from `@playwright/test`, so
a change to how a shopper signs in touches one file.

| Fixture                            | What it does                                                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `login(credentials?)`              | Signs in through the API on the browser context's cookie jar; defaults to the seeded `doe@example.com`           |
| `SEEDED_ADMIN`                     | The seeded `admin@example.com` credentials, for `login` or the login form                                        |
| `freshShopper()`                   | A unique name, email and password, not yet signed up, for a spec that drives the signup form                     |
| `signUpFreshShopper()`             | Creates a user with a unique email and name and returns its credentials                                          |
| `placeOrdersAsFreshShopper(count)` | Signs up one shopper in its own cookie jar, places `count` orders one after another, returns the shopper and ids |
| `placeOrderAsFreshShopper()`       | The same with one order; returns the shopper and that order's id                                                 |
| `placeOrder(product?)`             | Orders one of `product` (the first catalogue product by default) as the signed-in context; returns its id        |
| `listOrders()`                     | `GET /api/v1/orders` for the signed-in context                                                                   |
| `resetCart()`                      | `DELETE /api/v1/cart` for the signed-in context                                                                  |
| `catalogue`                        | Reads the catalogue through the products and categories API                                                      |
| `admin`                            | Admin writes and reads through the API on the browser context's session, for a test that arrives as the admin    |
| `disposableProduct(source)`        | A create body with unique names and slug, in `source`'s category and borrowing its images                        |
| `ORDERS_LOCK`, `CATALOGUE_LOCK`    | Playwright lock names; see [Writing a test](#writing-a-test)                                                     |

`catalogue` is how a spec learns what to assert: `showCaseProducts()`, `featuredProduct()`,
`products()`, `productBySlug(slug)` and `productsByCategory(category)`. Assert against what the API
says the catalogue holds rather than against literals, and a reseeded product does not break a test.
`products()` leaves out disposable products, so "the first product" stays a seeded one while a
slot test has one in the catalogue.

`admin` holds `setOrderStatus`, `setPaymentStatus` (both answer the order, `total` included),
`updateProduct`, `createProduct`, `deleteProduct`, `config`, `updateConfig` and `stats(period)`.
It is how an admin spec arranges state before driving a page and puts back what it changed in a
`finally`. The API answers with image URLs but stores and accepts bucket keys, which are the URL's
path; `disposableProduct` converts them back with `imageKeysOf`. The server does not check the
bucket, so borrowing another product's keys is how a spec gets a product with a showcase image the
seed has no spare of. A homepage slot cannot point at a missing product, so a spec puts the slot
back before it deletes the product, and never orders a disposable product.

State goes through the API, never the database. There is no Prisma client in this workspace and
there should not be one.

## Writing a test

- **Own your user when you write.** Anything that mutates cart or order state on the server calls
  `signUpFreshShopper()` first, so tests never share a cart and the suite can raise its worker count
  later. Read-only signed-in flows get the seeded shopper for free: the `setup` project signs in once
  and the `chromium` and `mobile` projects load its storage state.
- **Arrive as the admin with `test.use({ storageState: ADMIN_STORAGE_STATE })`.** The same setup
  signs in the seeded `admin@example.com` into a second state file beside the shopper's. It is
  read-only too: an admin flow that writes gets the data it changes from `placeOrderAsFreshShopper()`,
  which keeps the shopper's session out of the admin's cookie jar, and finds it by that shopper's
  email rather than by position in the list. A list assertion filters by that email too, so a
  count is the spec's own however many orders other specs place.
- **Take a lock for shared counts and slots.** Local runs are fully parallel. The stats cards count
  the whole shop's orders, so the stats tests and every test that places an order declare
  `test.describe.configure({ lock: ORDERS_LOCK })`, and a stats test expects exactly its own order
  on top. The catalogue edits, the homepage slot tests and the storefront tests that assert what the
  catalogue API said a moment before (home, categories) declare `CATALOGUE_LOCK`. Tests sharing a
  lock never run at the same time; everything else stays parallel. A new test that places an order
  or changes the catalogue takes the matching lock.
- **Opt out of that state for a guest flow.** `test.use({ storageState: { cookies: [], origins: [] } })`
  at the top of the file. A guest cart lives in `localStorage` under `audiophile_cart`, which every
  fresh context starts without. To hold credentials and still arrive signed out, sign up and then
  `context.clearCookies()` — the signup response set the cookie. A context a test makes itself,
  through `browser.newContext()` or `playwright.request.newContext()`, inherits the test's
  `storageState` as well, so a second browser for another user passes that same empty state.
- **Locate by role and accessible name first**, then text and label. `data-testid` only where
  neither identifies an element among siblings, named by a domain noun from `GLOSSARY.md`. The client
  has no `data-testid` today and the suite does not need one: a product card is an `article`, a
  mini-cart line is a `heading` carrying the product's cart label, the mini-cart is a `dialog`, an
  order under account orders is an `article` whose lines are `heading`s. The admin sidebar and its
  phone tab bar are both a `navigation` named `Admin sections`; only the one the viewport shows is
  visible to a locator.
- **Web-first assertions only.** `expect(locator).toBeVisible()` retries; `expect(await locator.isVisible())`
  does not, and `page.waitForTimeout` is a flake waiting to happen. TanStack Query refetches behind
  most of these pages, so this is the rule that matters most.
- **Put a phone flow under `tests/mobile/`.** See [Projects](#projects).
- **Nothing below the browser.** No database reads, no imports of server or client code, no
  assertions on request counts or component names.

## Projects

| Project    | Device profile   | Runs                                 |
| ---------- | ---------------- | ------------------------------------ |
| `setup`    | none             | `*.setup.ts`: the two sign-ins       |
| `chromium` | `Desktop Chrome` | every spec outside `tests/mobile/`   |
| `mobile`   | `Pixel 7`        | the specs under `tests/mobile/` only |

`chromium` and `mobile` both depend on `setup` and load the shopper's storage state. A spec opts
into the phone by living under `tests/mobile/`: `mobile` takes that directory as its `testDir`,
and `chromium` ignores it, so a spec runs in exactly one of the two by where its file is, with no
tag to forget or to leave on a desktop spec. A phone spec imports from `../fixtures.js` and follows
every rule above. It covers what only the phone layout shows; a desktop flow is not repeated there,
which keeps the extra time to a few seconds.

`Pixel 7` is a Chromium profile with `isMobile` and `hasTouch` set, so a phone spec taps
(`locator.tap()`) where a desktop spec clicks, and it runs on the one browser a
[cloud session](#cloud-sessions) and CI have; an iPhone profile would need WebKit. Its 412px
viewport is below every breakpoint the client reads (`sm`, `md`, `lg`): the storefront shows the
menu button instead of the category links and the admin shows its tab bar instead of the sidebar.
Assert those through roles, accessible names and URLs, not their markup, which a later roadmap
group reworks.

## Agents

Three Playwright agents live at the repo root rather than here, because that is where Claude Code
looks: the planner walks the running app and writes a plan into `specs/`, the generator turns one
plan item into a spec, and the healer debugs a failing one. All three drive the Playwright test MCP
server declared in `.mcp.json`, which `.claude/settings.json` pre-allows so the healer does not
stop on a permission prompt mid-run. `.agents/skills/playwright-trace` reads a trace from the
command line when a failure needs more than the HTML report.

A planning pass is not read-only. The planner explores by driving the real app, so it signs in as
the seeded shopper and leaves whatever it touched behind — a guest cart in `localStorage`, cart
items on the server. That is `audiophile-e2e` and never the `audiophile` a `pnpm dev` session uses,
and the next `pnpm test:e2e` reseeds it, but a database open in Compass while an agent runs is not
showing you seed data. The plans it writes are not kept either: everything in `specs/` but its README is git-ignored,
and the spec the generator produces from one is the reviewable artifact.

`tests/seed.spec.ts` is how they get a page: the planner and the generator run that one test and
take over the browser it leaves behind, so it has to stay collectable by the `chromium` project —
which is also why it runs as part of a normal suite.

The server's working directory is the repo root, so a path an agent hands it is the same path every
other tool here takes, and its scratch files land in a git-ignored `.playwright-mcp/`. It is started
through `apps/e2e/node_modules/@playwright/test/cli.js` with an explicit `--config` instead of the
`npx playwright` the initialiser writes, because `playwright` is a dependency of this workspace and
does not resolve from the root of a pnpm monorepo. That root working directory is also why
`STORAGE_STATE` is an absolute path: relative artifact paths follow the process, and a run the
agents start would otherwise drop `playwright/.auth/user.json` beside the lockfile.

`browser_click` takes a ref from a fresh `browser_snapshot` (`e12`, `f1e12`) or a real selector.
A description such as `button "Open cart"` is neither, and the server swallows it into an empty
selector, so `Unexpected token "" while parsing css selector ""` means the target was unparseable,
not that the page was empty. Take a snapshot and click by ref.

### Regenerating them

After a Playwright upgrade, both initialisers are worth re-running — and both overwrite silently,
with no diff and no prompt:

```bash
node apps/e2e/node_modules/@playwright/test/cli.js init-agents --loop claude --config apps/e2e/playwright.config.ts
node apps/e2e/node_modules/@playwright/test/cli.js init-skills --loop claude
```

Run them from the repo root. From here they write a second `.claude/agents/` and `.mcp.json` under
`apps/e2e/`, which Claude Code never reads. Then re-apply the repository customizations:

1. **`model: inherit`** in the healer, and only the healer. The initialiser writes `model: sonnet`
   for all three and that is right for two of them: the planner and the generator work breadth-first
   over a site, many turns deep, each turn re-reading every accessibility snapshot it has taken so
   far, so the per-turn model choice sets the wall clock and a planning pass on a reasoning model
   runs for an hour. The healer is the depth-first one — it reads a failure and forms a hypothesis —
   and is worth the stronger model.
2. **The planner's pointer at the router.** `apps/client/src/app/router.tsx` is the source of routes,
   not `apps/client/src/config/paths.ts`.
3. **The planner's snapshot-before-click line** in step 1, which has it click by ref rather than by
   display text.
4. **The `.mcp.json` command**, and any MCP server entry beyond `playwright-test` — the only one it
   writes, into a file it replaces wholesale.
5. **The trace skill's relocation.** Move `.claude/skills/playwright-trace` to `.agents/skills/`,
   symlink it back with `ln -s ../../.agents/skills/playwright-trace .claude/skills/playwright-trace`,
   rewrite `npx playwright trace` to `pnpm --filter e2e exec playwright trace`, and delete the
   `playwright-cli` and `playwright-component-testing` skills installed alongside it.
6. **The repository rules in all three agents.** Restore the entry instruction to read
   `AGENTS.md` and this guide. The generator follows the fixture, state, locator and comment
   conventions; it does not add comments for every step. The planner separates missing product
   features from implemented flows. The healer preserves valid assertions when the product is
   broken and reports the reproduction and expected behavior; skipping, marking `fixme`, or
   weakening a test is not a substitute for resolving that failure. Application fixes stay
   within the assigned scope.

## What it covers

Home showcase, the Headphones, Earphones and Speakers listings (one parametrised spec, with the "new
product" overline on the cards the catalogue flags), signup through the form (signed in with the
name in the account menu, then the same email refused under the email field), logout from the
account menu (login offered again, checkout redirecting to login), a guest add-to-cart through the
mini-cart, the checkout redirect to login and back, a guest cart surviving sign-in, a checkout that
creates an order and finds it under account orders, checkout validation (an empty submit stopped by
the browser, then an email the browser accepts but the shared schema rejects shown inside the
shipping fieldset, with no order either way), account orders' empty state and then two orders placed
through the API listed newest first, the not-found page, the admin shell (the account menu's Admin
item and `/admin` for the admin, not-found there for a shopper, the login redirect and return for a
guest), admin order fulfilment (a fresh shopper's order found by email, moved to Processing and
marked Paid, after which, with no reload, the order select offers Shipped and no longer Pending and
the payment select offers Refunded and neither Pending nor Failed), admin order lists (a fresh
shopper's two orders, one moved to Processing and the other marked Paid through the API, each found alone by the
status filter and by the payment status filter; twenty-one orders of one shopper paged as "Showing
1–20 of 21" and then the oldest alone on page two, with Prev and Next disabled at each end), the
cancel path (a Paid order moved to Cancelled shows the refund reminder, after which the order select
is disabled and the payment select offers Refunded and neither Pending nor Failed), admin user
management (a fresh shopper found by email, deactivated, told so by the login form in a browser
context of their own, reactivated and signed in; another promoted, shown as Admin in the users list,
offered the account menu's Admin item in a browser context of their own, then demoted and offered it
no longer; and no role control on the admin's own page), admin catalogue edits (a seeded product's
price raised on its edit page and shown on its storefront page; another's description, first
in-the-box quantity, full label and new-product flag changed and shown there, the "new product" overline
appearing and then disappearing when the flag is cleared again; each put back through the API), the
homepage slots (the picker offering the featured slot only the one seeded product with a featured
image and a showcase slot the three showcase products with the two held elsewhere disabled; and a
disposable product created through the API with the grid product's images, saved into the grid slot
and shown on the home page, then the slot put back and the product deleted), admin stats (the week's
orders count and revenue read from the stat cards, then read again after a fresh shopper's order is
placed and marked Paid through the API, each up by that one order; and the same order counted once
on the 30 days, 90 days and All time tabs against the API's numbers from before it), and the crawler
surface: a product
page's JSON-LD, the robots file and the sitemap the preview proxies to the server.

On the phone profile: the storefront menu opened from its button, listing the three categories and
closing on the way to one; a guest mini-cart opened from the cart button and closed with Continue
Shopping; and the admin tab bar, the only `Admin sections` navigation the phone shows, moving
through Orders, Users, Products, Homepage and Stats.

Every checkout input is `required`, so the browser's constraint validation stops an empty submit
before the form's schema runs: the spec asserts the focus move and every field `:invalid`, not the
schema's own "is required" messages, which a shopper cannot reach. The server-field-error path of
[ADR 0006](../../docs/adr/0006-server-validation-errors-belong-to-the-form.md) is driven through
signup's taken email. Checkout validates with the server's own body schema, so the real server never
rejects a field the client passed; that path stays in
[the order route tests](../server/test/order.route.test.ts) and
[the client's form-error tests](../client/test/form-errors.test.ts).

The order flows are the ones that write, so each test in `order.spec.ts` signs up its own shopper
and counts that shopper's orders exactly. The checkout form groups its inputs under
`Shipping details`, `Billing address` and `Payment method` fieldsets, so a label such as `City` is
reached through its group rather than on the page.

## Cloud sessions

A Claude Code cloud session cannot download a browser. The container image preinstalls one Playwright
and one Chromium build under `PLAYWRIGHT_BROWSERS_PATH`, sets `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD`, and
the session proxy refuses the Playwright CDN, so `playwright install chromium` fails there. When the
`@playwright/test` pin here moves ahead of the image, `playwright-core` asks for a Chromium revision
the image does not have and every launch fails with
`Executable doesn't exist at .../chromium_headless_shell-<revision>/...`.

The SessionStart hook in `.claude/hooks/session-start.sh` closes that gap. After installing
dependencies it reads the `chromium`, `chromium-headless-shell` and `ffmpeg` revisions the installed
`playwright-core` wants from its `browsers.json` and, for each one missing under
`PLAYWRIGHT_BROWSERS_PATH`, symlinks the single installed build of that browser under the wanted
name. It creates nothing when the revision is already installed, when the path is unset or
unwritable, or when there is no build to alias, and says so on one line without failing the rest of
session setup. The `e2e` task in `turbo.json` passes `PLAYWRIGHT_BROWSERS_PATH` through, since Turbo's
strict environment would otherwise hide it and Playwright would look in its default cache. So a fresh
session runs `pnpm test:e2e` without a manual step, given the local replica set the same hook brings
up.

The suite therefore runs against the image's Chromium, which can be older than the one CI downloads
with `--with-deps`. Nothing needs doing when the pin moves: the hook re-aliases on the next session.
If a spec ever needs a Chromium feature the image's build lacks, wait for the image to catch up or
pin `@playwright/test` to the image's version; and confirm a failure that reproduces only in a cloud
session against CI's downloaded Chromium before treating it as a product bug.

## CI

The `e2e` job in `.github/workflows/ci.yml` runs in parallel with `verify` and `image`, and `deploy`
needs all three, so a red suite blocks a deploy. It brings up the same compose database local
development uses, seeds and pushes, installs Chromium with `--with-deps` and no browser cache, and
uploads `playwright-report/` as an artifact with thirty-day retention.

The job runs every project, the phone specs included. On CI the suite runs with two retries, one
worker, the `github` reporter for failure annotations on the run, and `trace: "on-first-retry"`. So a failure gives a step annotation in the PR checks and a
trace inside the downloaded report; unzip it and open it with `pnpm --filter e2e exec playwright show-report <dir>`
or at `trace.playwright.dev`.
