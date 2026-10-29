# Playwright end-to-end testing for Audiophile — research note

> Historical proposal for the first E2E implementation. The executable examples below are
> superseded: current tests use dedicated ports, never reuse dev servers, and seed before schema
> push. Use the [E2E guide](../../apps/e2e/README.md),
> [current config](../../apps/e2e/playwright.config.ts) and
> [CI workflow](../../.github/workflows/ci.yml) for authoring, running or changing the suite.

Written 2026-10-12 as the input for the first E2E ticket. It answers three questions: where
Playwright should live in this monorepo and how to set it up, which of Playwright's documented
best practices actually bind here, and how Claude Code (or any coding agent) should author and
run the tests. Every claim names its source; repo facts cite file paths, external facts cite the
page in the "Verification trail" appendix. Versions were read from the npm registry on the day of
writing: `@playwright/test` 1.64.0 (published 2026-10-12), `@playwright/mcp` 0.0.83,
`@playwright/cli` 0.1.22. Nothing in the repo was modified.

## Recommendation

### Where it lives: a new `apps/e2e` workspace

A separate workspace, not a folder inside `apps/client`. Evidence:

- `pnpm test` means unit tests. The root script is `turbo run test` and the `test` task in
  `turbo.json` depends on `^build` only, needs no database, and runs in the `verify` CI job under
  a 10-minute budget (`.github/workflows/ci.yml`). Dropping Playwright specs into a workspace that
  already has a `test` script would either run them from `vitest run` (wrong runner) or force a
  config fork. A new workspace with no `test` script keeps `pnpm test` unchanged and gets its own
  Turbo task.
- `apps/client` lint and type-check are shaped for browser code: `eslint.config.js` applies
  `globals.browser`, `react-hooks` and `react-refresh` rules to every `**/*.{ts,tsx}`, and
  `tsconfig.app.json` includes `src` and `test` under `moduleResolution: bundler` with
  `noUncheckedSideEffectImports`. Playwright specs are Node programs; they would fight both.
- The repo already has a leaf workspace with the exact shape needed: `packages/media` is a
  scripts-and-tests package with its own `eslint.config.js` spreading `base` from
  `@repo/eslint-config/base`, a `tsconfig.json` extending `@repo/typescript-config/base.json` with
  `types: ["node"]` and `noEmit`, and `lint` / `type-check` scripts that Turbo picks up. `apps/e2e`
  copies that pattern.
- E2E needs both the server (8000) and the client (5173, proxying `/api` to 8000 in both `server`
  and `preview` blocks of `apps/client/vite.config.ts`) plus the Docker replica set. A workspace
  that depends on nothing at import time but orchestrates both through `webServer` is the honest
  expression of that.

`apps/` over `packages/` because nothing imports it and it is run, not built; it sits beside the
two things it exercises.

### Test data and isolation

- **Baseline per run: `pnpm db:seed` into its own database.** The seed drops the database and
  creates six demo users plus the catalogue (`packages/database/src/seed/index.ts`,
  `users.seed.ts`). Point it at `audiophile-e2e`, never `audiophile`, for the same reason
  `AGENTS.md` keeps `audiophile-test` apart: the seed is destructive. The server under test gets
  the same `DATABASE_URL` through the `webServer` `env` block; `dotenv` never overrides a variable
  that is already set (`AGENTS.md`, "Seeding vs syncing"), so `apps/server/.env` cannot redirect
  it.
- **Demo credentials.** `packages/database/src/seed/users.seed.ts` creates three `ADMIN` users
  (`admin@example.com`, `admin2@`, `admin3@`) and three `USER`s (`doe@example.com`, `doe2@`,
  `doe3@`), all with password `11111111`. These are the login fixtures; one `USER` per worker is
  what the Playwright auth guide's `parallelIndex` pattern needs, which caps `workers` at 3 for
  signed-in projects unless more users are seeded or created at setup.
- **Per-test state through the API, not the database.** The `tdd` skill
  (`.claude/skills/tdd/SKILL.md`) says tests live at seams and never reach inside; for E2E the seam
  is the HTTP API. A fixture that needs a fresh cart calls `DELETE /api/v1/cart`
  (`apps/server/src/routes/cart.route.ts`); a fresh account uses `POST /api/v1/auth/signup` with a
  unique email. Playwright's `request` fixture respects `baseURL` and is the documented way to do
  this (api-testing page).
- **Rate limiters are the blocker.** `apps/server/src/utils/rateLimiters.ts` caps signup at 5 per
  hour per IP, login at 10 per 15 minutes (successful logins refunded), order creation at 20 per
  hour, and the whole API at 500 per 15 minutes. Every E2E worker shares one IP. Nothing in the
  file or in `src/utils/env.ts` disables them for `NODE_ENV=test`. A prerequisite change is needed
  before a suite of any size can run: either an opt-out when `NODE_ENV === "test"` (the value the
  vitest config already uses, and the env schema already accepts), or an explicit
  `RATE_LIMIT_DISABLED` variable. This is the first open question below.
- **Guest cart lives in `localStorage`** under `audiophile_cart`
  (`apps/client/src/lib/cart-storage.ts`), so signed-out flows need an empty `storageState` and
  nothing else; Playwright gives every test a fresh context, so that is the default.

### Setup steps

1. Scaffold the workspace. The official entry point is still the `create` command; for pnpm it is
   `pnpm create playwright` (intro page). Run it inside the new directory and answer TypeScript,
   tests folder `tests`, no GitHub Actions workflow (the job is written into `ci.yml` by hand, step
   7), and yes to installing browsers.

   ```bash
   mkdir -p apps/e2e && cd apps/e2e && pnpm create playwright
   ```

   `@playwright/test` 1.64.0 depends on `playwright` 1.64.0; neither has an install script, so
   `onlyBuiltDependencies` in `pnpm-workspace.yaml` needs no entry. Browsers come from
   `npx playwright install`, which the scaffold runs.

2. Replace the generated `package.json` with the workspace shape used by `packages/media`:

   ```json
   {
     "name": "e2e",
     "private": true,
     "type": "module",
     "scripts": {
       "e2e": "playwright test",
       "e2e:ui": "playwright test --ui",
       "e2e:report": "playwright show-report",
       "lint": "eslint . --max-warnings 0",
       "type-check": "tsc -p tsconfig.json --noEmit"
     },
     "devDependencies": {
       "@playwright/test": "1.64.0",
       "@repo/eslint-config": "workspace:*",
       "@repo/typescript-config": "workspace:*",
       "@types/node": "^24.13.4",
       "eslint": "^10.10.0",
       "typescript": "5.9.3"
     }
   }
   ```

   Pin `@playwright/test` exactly: the browser build is tied to the package version and the
   `mcr.microsoft.com/playwright:v1.64.0-noble` image tag, if ever used, must match it (ci page).
   Then `pnpm install` from the root so the workspace links.

3. `tsconfig.json`, after `packages/media/tsconfig.json`. The shared base sets
   `lib: ["ES2022"]` with no DOM, and `page.evaluate` callbacks reference `window`, so add DOM:

   ```json
   {
     "extends": "@repo/typescript-config/base.json",
     "compilerOptions": {
       "types": ["node"],
       "lib": ["ES2022", "DOM", "DOM.Iterable"],
       "rootDir": ".",
       "noEmit": true
     },
     "include": ["tests/**/*.ts", "playwright.config.ts"],
     "exclude": ["node_modules", "playwright-report", "test-results"]
   }
   ```

4. `eslint.config.js`, after `packages/media/eslint.config.js`: spread `base`, add the env names
   the config reads to the `turbo/no-undeclared-env-vars` allow list (`CI` at least), and enable
   `@typescript-eslint/no-floating-promises`, the one rule Playwright's best-practices page asks
   for. That rule is type-aware, so it needs `languageOptions.parserOptions.project` pointing at
   the tsconfig; the shared `base` uses `tseslint.configs.recommended`, which is not type-checked,
   so the e2e config adds this locally rather than changing the base.

5. `playwright.config.ts`. The skeleton below follows the test-configuration page's defaults and
   the webserver page's array form. Server first, client second; both poll a URL, the client's
   `vite preview` serves the built bundle and proxies `/api` (preview block in
   `apps/client/vite.config.ts`), so the build the `verify` job already runs is what gets tested.

   ```ts
   import { defineConfig, devices } from "@playwright/test";

   const databaseUrl =
     "mongodb://localhost:27017/audiophile-e2e?replicaSet=rs0&directConnection=true";

   export default defineConfig({
     testDir: "tests",
     fullyParallel: true,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 2 : 0,
     workers: process.env.CI ? 1 : undefined,
     globalTimeout: 15 * 60 * 1000,
     reporter: process.env.CI
       ? [["github"], ["html", { open: "never" }]]
       : [["list"], ["html", { open: "on-failure" }]],
     use: {
       baseURL: "http://localhost:5173",
       trace: "on-first-retry",
     },
     projects: [
       { name: "setup", testMatch: /.*\.setup\.ts/ },
       {
         name: "chromium",
         use: { ...devices["Desktop Chrome"] },
         dependencies: ["setup"],
       },
     ],
     webServer: [
       {
         name: "server",
         command: "node apps/server/dist/index.js",
         cwd: "../..",
         url: "http://localhost:8000/api/v1/health",
         reuseExistingServer: !process.env.CI,
         env: {
           NODE_ENV: "test",
           PORT: "8000",
           DATABASE_URL: databaseUrl,
           JWT_SECRET: "e2e-secret-that-is-at-least-32-characters",
           JWT_EXPIRES_IN: "1d",
           JWT_COOKIE_EXPIRES_IN: "1",
           MEDIA_BASE_URL: "https://audiophile-media.t-bendet.com",
         },
       },
       {
         name: "client",
         command: "pnpm --filter client exec vite preview",
         cwd: "../..",
         url: "http://localhost:5173",
         reuseExistingServer: !process.env.CI,
       },
     ],
   });
   ```

   Notes on the choices: `GET /api/v1/health` exists (`apps/server/src/routes/health.route.ts`)
   and the server only listens after a successful MongoDB ping (`apps/server/src/index.ts`), so
   polling it also proves the database is up. The six server variables are the set
   `apps/server/vitest.config.ts` supplies for the same reason: `src/utils/env.ts` validates them
   at import. `NODE_ENV=test` makes the server behave like production (sanitised errors, silent
   logger per `AGENTS.md`), which is the behaviour a browser test should see. One Chromium project
   to start; the best-practices page recommends all three engines, which is a later widening once
   the suite is stable. `workers: 1` on CI is the documented default and sidesteps the rate-limit
   and seeded-user caps until the open questions are settled.

6. Auth setup project and fixtures. `tests/auth.setup.ts` logs in through the API and saves
   `storageState` (auth page, "API-request login"):

   ```ts
   import { test as setup } from "@playwright/test";

   setup("authenticate", async ({ request }) => {
     await request.post("/api/v1/auth/login", {
       data: { email: "doe@example.com", password: "11111111" },
     });
     await request.storageState({ path: "playwright/.auth/user.json" });
   });
   ```

   The cookie is `httpOnly`, `sameSite: "lax"`, and `secure` only when the request arrived over
   HTTPS (`apps/server/src/controllers/auth.controller.ts`), so it round-trips through the Vite
   proxy on plain `http://localhost:5173` unchanged. Add `playwright/.auth` to `.gitignore` as the
   auth page instructs; add `playwright-report/`, `test-results/` and `blob-report/` to both
   `.gitignore` and `.prettierignore` (the root `format` glob is `**/*.{ts,tsx,md}` and the HTML
   report contains none of those, but `test-results` can hold `.md` attachments). Put `test` and
   `expect` behind a `tests/fixtures.ts` that extends `base` (fixtures page); every spec imports
   from there, which is also what Playwright's own agents expect of a seed test (see "AI and agent
   usage").

7. Turbo and root scripts. Add a task that is not `test`:

   ```json
   "e2e": {
     "dependsOn": ["server#build", "client#build"],
     "cache": false,
     "outputs": [],
     "env": ["CI"]
   }
   ```

   The package-qualified `dependsOn` form is already used by `server#deploy` in `turbo.json`.
   Root `package.json` gets `"test:e2e": "pnpm db:up && turbo run e2e"`, mirroring `test:db`. The
   seed into the e2e database is a separate, explicit command because it is destructive:

   The original proposal pushed the schema before seeding. That sequence was corrected during
   implementation because seeding drops indexes: the maintained root `pnpm test:e2e` command
   now seeds first and pushes second. Use that command rather than this historical setup plan.

   Whether to fold the seed into a Playwright setup project (so `pnpm test:e2e` is one command) is
   open question 2.

8. CI: a separate `e2e` job, parallel to `verify`, with `deploy` needing all three. Rationale:
   `verify` already carries a 10-minute test budget and a MongoDB-binary cache that E2E does not
   use; a sibling job isolates browser installation and Docker start-up, and a red E2E run is
   reported on its own. Repeating install and build is what the `deploy` job already does. MongoDB
   comes from the repo's `docker-compose.yml` via `pnpm db:up`: the ubuntu-24.04 runner image ships
   Docker 28.0.4 and Docker Compose v2 2.38.2 (runner-images README, image 20261004), and the
   compose healthcheck is what runs `rs.initiate()` (`docker-compose.yml`, `AGENTS.md` "Local
   database"). GitHub's `services:` form can pass `command: --replSet rs0` (service-containers
   page documents `command` and `entrypoint`) but has nowhere to run the initiate, so compose is
   the smaller change and keeps one definition of the database.

   ```yaml
   e2e:
     name: E2E
     runs-on: ubuntu-latest
     env:
       DATABASE_URL: mongodb://localhost:27017/audiophile-e2e?replicaSet=rs0&directConnection=true
       MONGOMS_DISABLE_POSTINSTALL: "1"
     steps:
       - uses: actions/checkout@v7
       - uses: pnpm/action-setup@v6
       - uses: actions/setup-node@v7
         with:
           node-version-file: .nvmrc
           cache: pnpm
       - name: Assert Node matches .nvmrc
         run: bash .github/scripts/assert-node-version.sh
       - run: pnpm install --frozen-lockfile
         timeout-minutes: 10
       - run: pnpm db:up
       - run: pnpm db:generate
       - run: pnpm build
       # Corrected from the original proposal: seed drops indexes; push rebuilds them.
       - run: pnpm db:seed && pnpm db:push
       - run: pnpm --filter e2e exec playwright install chromium --with-deps
       - run: pnpm --filter e2e run e2e
       - uses: actions/upload-artifact@v4
         if: ${{ !cancelled() }}
         with:
           name: playwright-report
           path: apps/e2e/playwright-report/
           retention-days: 30
   ```

   `install chromium --with-deps` installs one browser plus its OS packages, the best-practices
   page's "only install the browsers that you actually need". Playwright's ci page says caching
   browser binaries is "not recommended" because restoring takes as long as downloading, so there
   is no cache step. No job-level `timeout-minutes`: the ci-intro page leaves it out in favour of
   `globalTimeout` in the config, which fails with a report instead of a cancelled job. The
   `MONGOMS_DISABLE_POSTINSTALL` line reuses the `deploy` job's trick: no vitest runs here, so the
   in-memory binary is dead weight. Sharding (`--shard`, `blob` reporter, `merge-reports`) is
   documented and simple to add once a single job exceeds a few minutes; not before.

### The flows to cover first

Read from `apps/client/src/app/router.tsx` and `src/config/paths.ts`, with the API each one hits
(`apps/server/src/routes/*.route.ts`):

| Flow             | Route(s)                                                                | API                                                       |
| ---------------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| Browse           | `/` → `/category/:categoryName` (`Headphones`, `Earphones`, `Speakers`) | `GET /categories`, `GET /products`, `/products/show-case` |
| Product          | `/product/:productSlug`                                                 | `GET /products/slug/:slug`                                |
| Cart (guest)     | mini-cart component, `localStorage`                                     | none until sign-in, then `POST /cart/sync`                |
| Cart (signed in) | mini-cart                                                               | `GET/POST /cart`, `PATCH/DELETE /cart/items/:id`          |
| Checkout         | `/checkout`                                                             | `POST /orders` (limiter: 20/hour)                         |
| Auth             | `/auth/login`, `/auth/signup` (`?redirectTo=`)                          | `POST /auth/login`, `/auth/signup`, `/auth/logout`        |
| Account          | `/account` → `/account/profile`, `/account/security`, `/account/orders` | `GET /users/me`, `PATCH /users/updateMe`, `GET /orders`   |
| Not found        | `*`                                                                     | —                                                         |

Two paths exist in `paths.ts` but not in the router: `/cart` and `/checkout/confirmation/:orderId`
(and `/checkout/payment`). A planner agent that reads `paths.ts` will try to navigate to them;
the seed spec or the plan prompt should say they are not routes.

## Best practices that apply here

Each item names the page it comes from; URLs are in the appendix.

- **Locate by role and accessible name first; test ids are the last resort.** The locators page
  lists the recommended locators in order (`getByRole`, `getByText`, `getByLabel`,
  `getByPlaceholder`, `getByAltText`, `getByTitle`, `getByTestId`) and reserves test ids for
  elements you "can't locate by" role or text. The client is Radix-based (`apps/client/package.json`),
  so dialogs, navigation menus, tabs and toasts already carry roles; there is not a single
  `data-testid` in `apps/client/src` today, and the first tests should not need many. Where one is
  needed (a product card among many, a cart line), the default attribute is `data-testid`
  (locators page); keep the default rather than configuring `testIdAttribute`, and name them by
  domain noun from `GLOSSARY.md`.
- **Web-first assertions, no manual waits.** `expect(locator).toBeVisible()` retries; checking
  `await locator.isVisible()` and asserting the boolean does not (best-practices page). The API
  reference marks `page.waitForTimeout` as discouraged: "Tests that wait for time are inherently
  flaky. Use Locator actions and web assertions that wait automatically." TanStack Query refetches
  in this client make this the single most likely source of flakes.
- **Each test fully isolated.** "Each test should be completely isolated from another test"
  (best-practices page). Playwright already gives each test its own context; the repo's part is
  not to share carts or orders between tests, which the API-based fixtures above handle.
- **Auth once, through a setup project.** The auth page's `storageState` pattern, with
  `dependencies: ['setup']`, and the global-setup page's advice that project dependencies are "the
  recommended approach" over `globalSetup` because they appear in the report and get traces.
- **`webServer` with `reuseExistingServer: !process.env.CI`.** Locally a developer's running
  `pnpm dev` is reused; CI always starts fresh (webserver page). Note the repo's `pnpm dev` points
  the server at `audiophile`, not `audiophile-e2e`, so a reused local server tests against dev
  data; the seed-into-e2e flow above is the CI truth.
- **Retries on CI with `trace: 'on-first-retry'`.** The best-practices page prefers traces over
  video and screenshots on CI and warns that `trace: 'on'` is heavy. `npx playwright show-trace`
  or trace.playwright.dev opens the zip (trace-viewer page).
- **Reporters.** `list` is the default locally, `dot` on CI; the `github` reporter adds failure
  annotations to a GitHub Actions run (reporters page). The config above pairs `github` with an
  `html` report uploaded as an artifact, which the ci-intro page says must be served with
  `npx playwright show-report <dir>` after unzipping.
- **Lint the tests.** `@typescript-eslint/no-floating-promises` and `tsc --noEmit` on CI
  (best-practices page), wired in steps 3 and 4.
- **Keep Playwright current.** Upgrade with `pnpm add -D @playwright/test@latest` then
  `npx playwright install --with-deps` (intro page), and regenerate agent definitions after each
  upgrade (test-agents page).
- **Linux on CI, one browser until the suite earns more.** Best-practices page.

## AI and agent usage

Three official Microsoft routes exist today, plus the `claude-in-chrome` MCP already attached to
this user's sessions. They solve different problems.

### 1. `@playwright/mcp` — a browser for the agent to drive

`claude mcp add playwright npx @playwright/mcp@latest` (playwright-mcp README) or, committed for
the team, a project-scoped `.mcp.json` (Claude Code MCP page):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--headless", "--isolated"]
    }
  }
}
```

It drives a browser through the accessibility tree ("not pixel-based input"), with
`browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_fill_form`,
`browser_console_messages`, `browser_network_requests` and so on; `--caps=testing` adds
`browser_generate_locator` and `browser_verify_*`, which is what turns an exploration into a
spec. `--storage-state` reuses the `playwright/.auth/user.json` file the setup project writes, so
the agent can land signed in. Claude Code prompts before using a project `.mcp.json` server in
interactive sessions and loads it without asking in `claude -p` (MCP page), which matters for the
`batch-tickets` skill.

### 2. Playwright Agents — planner, generator, healer

`npx playwright init-agents --loop=claude` (test-agents page). What it writes for the `claude`
loop, read from `packages/playwright/src/agents/generateAgents.ts` at `main` and confirmed present
in the `v1.64.0` tag of `program.ts`:

- `.claude/agents/playwright-test-planner.md`, `playwright-test-generator.md`,
  `playwright-test-healer.md` — Claude Code subagents with `model: sonnet` and a `tools` list that
  maps `search` to `Glob, Grep, Read, LS`, `edit` to `Edit, MultiEdit, Write` (healer only), and
  the rest to `mcp__playwright-test__<tool>`.
- `.mcp.json` with one server, `playwright-test`, running `npx playwright run-test-mcp-server`.
  **It overwrites the file.** If the `@playwright/mcp` entry from route 1 is wanted as well, add
  it after running `init-agents`, and re-add it after every regeneration.
- `specs/README.md` and `tests/seed.spec.ts` (relative to the project's `testDir`), the seed test
  the planner runs to inherit fixtures and the generator copies as a model.
- `--prompts` additionally writes `.claude/prompts/`; `--project` and `-c` pick the Playwright
  project and config. The `--loop` choices in 1.64.0 are `claude`, `codex`, `copilot`,
  `opencode`, `vscode`, `vscode-legacy`.

The `playwright-test` MCP server is different from `@playwright/mcp`: it is hidden in the CLI
(`run-test-mcp-server`, "Interact with the test runner over MCP") and exposes `test_list`,
`test_run`, `test_debug`, `planner_setup_page`, `planner_submit_plan`, `planner_save_plan`,
`generator_setup_page`, `generator_read_log`, `generator_write_test` plus the browser tools, all
read from `packages/playwright/src/mcp/test/*Tools.ts`. It runs the repo's own
`playwright.config.ts`, so it inherits `webServer`, `baseURL` and the auth project.

How that fits this repo: the three agents go in `.claude/agents/`, a directory that does not exist
yet (the repo has `.claude/skills/` only), so there is no collision. The workflow is planner →
`specs/<flow>.md` → generator → `tests/<flow>.spec.ts` → healer, and it maps onto the `tdd`
skill's "write down the seams and confirm them first": the spec file is the seam agreement, and
the generator's output is reviewed against `tests.md`'s "good test" criteria (public interface,
one logical assertion, no implementation coupling) before it is kept. The healer may also skip a
test it believes is a real bug (test-agents page); treat a healer skip as a ticket, not a pass.

### 3. `@playwright/cli` and `playwright init-skills`

`@playwright/cli` 0.1.22 is Microsoft's token-efficient alternative to MCP for agents
(`playwright-cli open|snapshot|click|fill|run-code`, "more token-efficient" because there are no
tool schemas; playwright-cli README). `playwright-cli install --skills` installs its skills for
Claude Code. Separately, Playwright 1.64.0 ships `npx playwright init-skills --loop claude`, which
copies three skills (`playwright-cli`, `playwright-component-testing`, `playwright-trace`) into
`.claude/skills/<name>/` (`packages/playwright-core/src/tools/utils/installSkills.ts`, tag
`v1.64.0`). The `playwright-trace` skill is the one worth having: it teaches the agent to read a
`trace.zip` from a failed CI run, which is the artifact the job above uploads. The `init-skills`
command is in the 1.64.0 source but is not on the test-agents docs page; treat its behaviour as
read from source.

### `claude-in-chrome` versus Playwright MCP for this job

The Chrome MCP drives the user's real, signed-in Chrome: good for looking at the deployed site or
a dev server interactively, bad as a test oracle, because it carries whatever cookies and
`localStorage` the user has, and nothing it does becomes a spec. Playwright MCP starts an isolated
browser with a known `storageState`, exposes `browser_generate_locator`, and the `playwright-test`
server can run and debug the suite under the repo's own config. For writing and debugging E2E
tests, use Playwright's servers; keep `claude-in-chrome` for one-off inspection of production.

### Conventions that make tests agent-writable

- Keep the deep-module style: one `tests/fixtures.ts` that owns login, cart reset and catalogue
  lookups, so a generated spec is a short script against named fixtures (`codebase-design`
  skill vocabulary). The planner reads the seed spec to learn the fixtures; make the seed spec
  import from `./fixtures` as the test-agents page's example does.
- Specs name flows in `GLOSSARY.md` words (cart line, order, catalogue), the same requirement the
  `tdd` skill puts on test names.
- Artifacts an agent can read after a CI failure: the `github` reporter's annotations, the HTML
  report artifact, and `test-results/**/trace.zip`, opened with the `playwright-trace` skill or
  `npx playwright show-trace`.
- Do not hand the agents `data-testid` as a shortcut: the generator "prioritizes role, text, and
  test ID" in that order (best-practices page), and the first two survive refactors.

## Open questions

1. **Rate limiters under `NODE_ENV=test`.** Signup 5/hour and orders 20/hour per IP
   (`apps/server/src/utils/rateLimiters.ts`) break any parallel suite. Decide between an
   environment opt-out and a very high limit in test; the fix is a small server change and should
   be its own ticket, merged before the suite grows past the seeded users.
2. **Seed as a setup project or as a CI step.** Running `db:seed` from a Playwright setup project
   (via `execFile`, as `apps/server/test/helpers/global-setup.ts` already does for `prisma db push`)
   would make `pnpm test:e2e` one command and put the seed in the HTML report; the cost is a
   workspace that imports `@repo/database`. The sketch above keeps it an explicit command.
3. **Which client server in CI: `vite preview` or `vite`.** Preview tests the real bundle and
   reuses the `verify` build; the dev server is what a developer reuses locally. Both proxy `/api`
   identically (`apps/client/vite.config.ts`). Preview is recommended above; confirm there is no
   dev-only behaviour (the React Router performance middleware is dev-only per `AGENTS.md`) that a
   test should see.
4. **One job or `needs: [verify]`.** Parallel is faster; sequential saves a browser install when
   lint already failed. Pick after the first few runs show real durations.
5. **How many engines.** One Chromium project is the starting point; the best-practices page says
   all three. WebKit matters for this project only if Safari-specific cookie behaviour is a risk,
   and with same-origin `sameSite: "lax"` cookies it is not.
6. **`@playwright/mcp` versus `playwright-test` MCP in `.mcp.json`.** `init-agents` writes only
   the latter and overwrites the file. Decide whether the repo commits both and documents the
   regeneration step.

## Verification trail (2026-10-12)

npm registry, read with `npm view` on 2026-10-12:

- `@playwright/test` — `dist-tags.latest = 1.64.0`, modified 2026-10-12T05:33Z; `engines.node >=20`;
  depends on `playwright@1.64.0`; no `scripts` on either package, so no pnpm build approval needed.
- `@playwright/mcp` — `0.0.83`, modified 2026-09-28.
- `@playwright/cli` — `0.1.22`, modified 2026-09-28.

Playwright docs (playwright.dev):

- `https://playwright.dev/docs/intro` — `npm init playwright@latest` / `pnpm create playwright` /
  `yarn create playwright` is still the documented setup; prompts (TypeScript, tests folder, GitHub
  Actions, browsers); generated files; Node 22/24/26, macOS 14+, Ubuntu 22.04/24.04/26.04;
  `npx playwright test`, `show-report`; update commands.
- `https://playwright.dev/docs/best-practices` — isolation quote, locator priority, web-first
  assertions, trace on first retry over video, Linux CI, `npx playwright install chromium --with-deps`,
  `no-floating-promises` + `tsc --noEmit`, sharding, keep up to date, all three browsers,
  `expect.soft`.
- `https://playwright.dev/docs/locators` — recommended locator order; "can't locate by" role/text
  for test ids; default `data-testid`; `testIdAttribute` under `use`.
- `https://playwright.dev/docs/test-configuration` — the basic config (`testDir`, `fullyParallel`,
  `forbidOnly`, `retries`, `workers`, `globalTimeout`, `reporter`, `use.baseURL`, `use.trace`,
  `projects`, `webServer`) and its comments; `timeout` 30 s, `expect.timeout` 5 s defaults.
- `https://playwright.dev/docs/test-webserver` — options incl. `url`, `reuseExistingServer`,
  `timeout` 60000 default, `cwd`, `env` (adds `PLAYWRIGHT_TEST=1`), `stdout`/`stderr`,
  `gracefulShutdown`, `name`, `wait`; `port` deprecated in favour of `url`; array form for several
  servers; `reuseExistingServer: !process.env.CI`.
- `https://playwright.dev/docs/auth` — `auth.setup.ts`, `page.context().storageState({ path })`,
  `testMatch: /.*\.setup\.ts/`, `dependencies: ['setup']`, `storageState: 'playwright/.auth/user.json'`,
  `.gitignore` line, `test.use({ storageState: { cookies: [], origins: [] } })`,
  `test.info().parallelIndex`, `request.post` + `request.storageState` login.
- `https://playwright.dev/docs/test-global-setup-teardown` — project dependencies are "the
  recommended approach" (report, traces, fixtures).
- `https://playwright.dev/docs/test-fixtures` — `base.extend<...>()`, `{ scope: 'worker' }`,
  import `test` from the shared module.
- `https://playwright.dev/docs/api-testing` — `request` fixture respects `baseURL`; seed/clean via
  API in `beforeAll`/`afterAll`.
- `https://playwright.dev/docs/test-parallel` — `fullyParallel`, `workers: 1`, serial mode
  discouraged, in-file order.
- `https://playwright.dev/docs/trace-viewer` — trace options (`off`, `on`, `retain-on-failure`,
  `on-first-retry`, `on-all-retries`), `npx playwright show-trace`, trace.playwright.dev, trace icon
  in the HTML report.
- `https://playwright.dev/docs/test-reporters` — `list` default locally, `dot` on CI, `github`
  annotations, `html` `open` values and `outputFolder`, `json`, `junit`, `blob`.
- `https://playwright.dev/docs/test-sharding` — `--shard=x/y`, matrix, `blob` on CI,
  `merge-reports --reporter html`, `fullyParallel: true` recommended for balance.
- `https://playwright.dev/docs/ci-intro` — workflow with `actions/checkout@v6`,
  `actions/setup-node@v6`, `npx playwright install --with-deps`, `upload-artifact@v4` with
  `if: ${{ !cancelled() }}`, `retention-days: 30`; no job `timeout-minutes`, use `globalTimeout`;
  `show-report` needs a web server.
- `https://playwright.dev/docs/ci` — "Caching browser binaries is not recommended";
  `mcr.microsoft.com/playwright:v1.64.0-noble`; `--with-deps`.
- `https://playwright.dev/docs/release-notes` — 1.64 (WebMCP, `default` project option,
  `--shuffle`, `locator.within()`, Chromium 156 / Firefox 157 / WebKit 27.2); no agents changes in
  1.64; MCP `--no-webmcp`.
- `https://playwright.dev/docs/test-agents` — planner/generator/healer; `init-agents --loop=vscode|claude|codex|opencode`;
  `specs/`, `tests/seed.spec.ts`; regenerate after upgrades; VS Code 1.105 note. The page's layout
  shows `.github/` for agent definitions and does not name `.claude/agents`; the Claude paths above
  come from source.
- `https://playwright.dev/docs/test-mcp` — 404; there is no docs page for the test MCP server.
- `https://playwright.dev/docs/api/class-page#page-wait-for-timeout` — the rendered page was too
  long to read through; the discouraged note was read from the source,
  `https://raw.githubusercontent.com/microsoft/playwright/v1.64.0/docs/src/api/class-page.md`
  (line 5767: "Never wait for timeout in production. Tests that wait for time are inherently
  flaky.").

Playwright source (github.com/microsoft/playwright):

- `packages/playwright/src/program.ts` at tag `v1.64.0` — `init-agents` with `--loop` choices
  `claude, codex, copilot, opencode, vscode, vscode-legacy`, `-c`, `--project`, `--prompts`;
  `init-skills --loop claude|agents` (default `claude`); hidden `run-test-mcp-server`
  (`--headless`, `-c`, `--host`, `--port`).
- `packages/playwright/src/agents/generateAgents.ts` at `main` — `ClaudeGenerator` writes
  `.claude/agents/<name>.md`, overwrites `.mcp.json` with `playwright-test` →
  `npx playwright run-test-mcp-server`, `search`/`edit` tool maps, `.claude/prompts` with `--prompts`;
  `initRepo` writes `specs/README.md` and the seed file.
- `packages/playwright/src/agents/playwright-test-{planner,generator,healer}.agent.md` — frontmatter
  (`model: sonnet`, tools lists; `edit` only on the healer).
- `packages/playwright/src/mcp/test/{testTools,plannerTools,generatorTools}.ts` — tool names
  `test_list`, `test_run`, `test_debug`, `planner_setup_page`, `planner_submit_plan`,
  `planner_save_plan`, `generator_setup_page`, `generator_read_log`, `generator_write_test`.
- `packages/playwright/src/mcp/test/seed.ts` — default seed file is `<testDir>/seed.spec.ts`.
- `packages/playwright-core/src/tools/utils/installSkills.ts` at `v1.64.0` — `allSkills =
['playwright-cli', 'playwright-component-testing', 'playwright-trace']`, copied to
  `.<target>/skills/<skill>` in cwd (or home with `global`).
- `https://github.com/microsoft/playwright/releases/tag/v1.56.0` — the release that introduced
  Playwright Agents and `init-agents`; no mention of `run-test-mcp-server` there.

Playwright MCP and CLI (github.com/microsoft):

- `https://github.com/microsoft/playwright-mcp` — package `@playwright/mcp`, `npx @playwright/mcp@latest`,
  `claude mcp add playwright npx @playwright/mcp@latest`, Node 18+, accessibility-tree snapshots,
  core tool list, `--caps` groups (`vision`, `pdf`, `devtools`, `testing` with
  `browser_generate_locator` / `browser_verify_*`), `--headless`, `--isolated`, `--storage-state`,
  `--browser`, `--config`, `--output-dir`, `--allowed-origins`; "not a security boundary".
- `https://github.com/microsoft/playwright-cli` — `@playwright/cli`, `npm install -g @playwright/cli@latest`,
  `playwright-cli install --skills`, `open|snapshot|click|fill|run-code`, "more token-efficient"
  than MCP, Node 18+.

Claude Code docs (code.claude.com):

- `https://code.claude.com/docs/en/mcp` — `claude mcp add [options] <name> -- <command> [args...]`,
  `--scope local|project|user`, `--transport`, `add-json`, project `.mcp.json` shape
  (`mcpServers`, `command`, `args`, `env`), `${VAR}` / `${VAR:-default}` expansion, approval prompt
  for project servers in interactive sessions and none in `claude -p`, `claude mcp reset-project-choices`,
  `disabledMcpjsonServers`.
- `https://code.claude.com/docs/en/sub-agents` — `.claude/agents/<name>.md`, `name`/`description`
  required, `tools`, `model`, `mcpServers`, `mcp__<server>__*` patterns, invocation by mention or
  `@agent-<name>`.
- `https://code.claude.com/docs/en/skills` — `.claude/skills/<name>/SKILL.md`, frontmatter
  (`name`, `description`, `allowed-tools`, `disable-model-invocation`, `user-invocable`, `context: fork`,
  `agent`, `model`, `hooks`), `$ARGUMENTS`.

GitHub (docs.github.com, actions/runner-images):

- `https://docs.github.com/en/actions/using-containerized-services/about-service-containers` —
  `services:` keys (`image`, `ports`, `env`, `credentials`, `command`, `entrypoint`), `localhost:<port>`
  only with a port mapping, Linux runners required.
- `https://docs.github.com/en/actions/using-containerized-services/creating-postgresql-service-containers` —
  `options: >- --health-cmd ... --health-interval ... --health-timeout ... --health-retries`.
- `https://raw.githubusercontent.com/actions/runner-images/main/images/ubuntu/Ubuntu2404-Readme.md` —
  image 20261004.327.1: Docker 28.0.4, Docker Compose v2 2.38.2, Node 22.23.3 with 24.21.0 cached.

Repository files read: `AGENTS.md`, `.github/workflows/ci.yml`, `docker-compose.yml`, `turbo.json`,
root `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.prettierignore`, `.nvmrc`,
`apps/client/{package.json,vite.config.ts,eslint.config.js,tsconfig.json,tsconfig.app.json,vitest.config.ts,.env.example}`,
`apps/client/src/app/router.tsx`, `apps/client/src/config/paths.ts`, `apps/client/src/lib/cart-storage.ts`,
`apps/server/{package.json,vitest.config.ts,.env.example}`, `apps/server/src/{app.ts,index.ts}`,
`apps/server/src/routes/*.route.ts`, `apps/server/src/controllers/auth.controller.ts` (cookie
attributes), `apps/server/src/utils/{rateLimiters.ts,env.ts}`, `apps/server/test/helpers/{setup.ts,global-setup.ts,database.ts}`,
`packages/database/package.json`, `packages/database/src/seed/{index.ts,users.seed.ts}`,
`packages/domain/src/category.ts`, `packages/config-eslint/{package.json,base.js}`,
`packages/config-typescript/base.json`, `packages/media/{package.json,eslint.config.js,tsconfig.json}`,
`.claude/skills/tdd/{SKILL.md,tests.md}`, `.claude/settings.local.json`, `README.md` roadmap.
`grep -rn data-testid apps/client/src` returned nothing.

Not verified from a primary source: the generated test path inconsistency on the test-agents page
(`tests/create/…` vs `tests/…`) is the page's own; the Windows `cmd /c npx` branch in
`generateAgents.ts` was read but not run; no command in this note was executed against the repo.
