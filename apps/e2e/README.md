# e2e

The Playwright smoke suite. A real Chromium drives the built client and the compiled server against
a dedicated seeded database, so a green run says the join between the two apps works: the Vite
proxy, the auth cookie, cart sync after login, the routes the router actually mounts. It is the one
thing in the repo that tests the artifacts that ship rather than a dev server.

Nothing here imports from the monorepo. The workspace has no `test` script either, so `pnpm test`
stays the fast, database-free unit run it has always been.

## Running it

```bash
pnpm test:e2e                               # the whole thing, from the repo root
pnpm --filter e2e run e2e:ui                # UI mode, against servers it starts
pnpm --filter e2e run e2e cart.spec.ts      # one file
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

| Fixture                | What it does                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `login(credentials?)`  | Signs in through the API on the browser context's cookie jar; defaults to the seeded `doe@example.com` |
| `signUpFreshShopper()` | Creates a user with a unique email and name and returns its credentials                                |
| `resetCart()`          | `DELETE /api/v1/cart` for the signed-in context                                                        |
| `catalogue`            | Reads the catalogue through the products and categories API                                            |

`catalogue` is how a spec learns what to assert: `showCaseProducts()`, `featuredProduct()`,
`products()`, `productBySlug(slug)` and `productsByCategory(category)`. Assert against what the API
says the catalogue holds rather than against literals, and a reseeded product does not break a test.

State goes through the API, never the database. There is no Prisma client in this workspace and
there should not be one.

## Writing a test

- **Own your user when you write.** Anything that mutates cart or order state on the server calls
  `signUpFreshShopper()` first, so tests never share a cart and the suite can raise its worker count
  later. Read-only signed-in flows get the seeded shopper for free: the `setup` project signs in once
  and the `chromium` project loads its storage state.
- **Opt out of that state for a guest flow.** `test.use({ storageState: { cookies: [], origins: [] } })`
  at the top of the file. A guest cart lives in `localStorage` under `audiophile_cart`, which every
  fresh context starts without. To hold credentials and still arrive signed out, sign up and then
  `context.clearCookies()` — the signup response set the cookie.
- **Locate by role and accessible name first**, then text and label. `data-testid` only where
  neither identifies an element among siblings, named by a domain noun from `GLOSSARY.md`. There is
  not one in the client today and the suite does not need one: a product card is an `article`, a
  mini-cart line is a `heading` carrying the product's cart label, the drawer is a `dialog`.
- **Web-first assertions only.** `expect(locator).toBeVisible()` retries; `expect(await locator.isVisible())`
  does not, and `page.waitForTimeout` is a flake waiting to happen. TanStack Query refetches behind
  most of these pages, so this is the rule that matters most.
- **Nothing below the browser.** No database reads, no imports of server or client code, no
  assertions on request counts or component names.

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
showing you seed data. The plans it writes are not kept either: `specs/*.plan.md` is git-ignored,
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

### Regenerating them

After a Playwright upgrade, both initialisers are worth re-running — and both overwrite silently,
with no diff and no prompt:

```bash
node apps/e2e/node_modules/@playwright/test/cli.js init-agents --loop claude --config apps/e2e/playwright.config.ts
node apps/e2e/node_modules/@playwright/test/cli.js init-skills --loop claude
```

Run them from the repo root. From here they write a second `.claude/agents/` and `.mcp.json` under
`apps/e2e/`, which Claude Code never reads. Then re-apply, because the regeneration drops all four:

1. **`model: inherit`** in the healer, and only the healer. The initialiser writes `model: sonnet`
   for all three and that is right for two of them: the planner and the generator work breadth-first
   over a site, many turns deep, each turn re-reading every accessibility snapshot it has taken so
   far, so the per-turn model choice sets the wall clock and a planning pass on a reasoning model
   runs for an hour. The healer is the depth-first one — it reads a failure and forms a hypothesis —
   and is worth the stronger model.
2. **The planner's pointer at the router.** `apps/client/src/app/router.tsx` is the source of routes,
   not `apps/client/src/config/paths.ts`.
3. **The `.mcp.json` command**, and any MCP server entry beyond `playwright-test` — the only one it
   writes, into a file it replaces wholesale.
4. **The trace skill's relocation.** Move `.claude/skills/playwright-trace` to `.agents/skills/`,
   symlink it back with `ln -s ../../.agents/skills/playwright-trace .claude/skills/playwright-trace`,
   rewrite `npx playwright trace` to `pnpm --filter e2e exec playwright trace`, and delete the
   `playwright-cli` and `playwright-component-testing` skills installed alongside it.

## What it covers

Home showcase, a category listing, a guest add-to-cart through the mini-cart, the checkout redirect
to login and back, a guest cart surviving sign-in, and the not-found page.

One flow the spec names is missing: placing an order and finding it under account orders. The
checkout page's "Continue to Payment" is an `alert()` placeholder and `/account/orders` renders a
static heading, so there is nothing a browser can drive end to end yet. The API behind it works and
`apps/server/test/order.route.test.ts` covers it; the browser test belongs with the ticket that
builds the checkout form and the order list.

## CI

The `e2e` job in `.github/workflows/ci.yml` runs in parallel with `verify` and `image`, and `deploy`
needs all three, so a red suite blocks a deploy. It brings up the same compose database local
development uses, seeds and pushes, installs Chromium with `--with-deps` and no browser cache, and
uploads `playwright-report/` as an artifact with thirty-day retention.

On CI the suite runs with two retries, one worker, the `github` reporter for failure annotations on
the run, and `trace: "on-first-retry"`. So a failure gives a step annotation in the PR checks and a
trace inside the downloaded report; unzip it and open it with `pnpm --filter e2e exec playwright show-report <dir>`
or at `trace.playwright.dev`.
