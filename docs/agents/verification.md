# Verification

Use this guide to select checks before handing off work and when changing the build or runtime. [package.json](../../package.json) defines local commands; [.github/workflows/ci.yml](../../.github/workflows/ci.yml) defines the current CI gates.

## Local checks

Run checks affected by the change. The ordinary application verification sequence is:

```bash
pnpm build
pnpm lint
pnpm type-check
pnpm test
pnpm format:check
pnpm docs:check
```

Generate the Prisma client with `pnpm db:generate` after a schema change or on a fresh checkout before building. Turbo builds dependencies in order; when workspace types are missing, build `packages/database` and `packages/domain` before their consumers. For focused commands, use the script names in the workspace's `package.json` with `pnpm --filter <workspace> run <script>`.

| Change                                   | Additional guidance                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Server behavior                          | [Server tests and database isolation](../../apps/server/README.md)                                   |
| Client behavior                          | [Client tests and error handling](../../apps/client/README.md)                                       |
| Shared domain contract                   | Domain tests plus consumer type-checks; [domain guide](domain.md)                                    |
| Browser journeys                         | [E2E guide](../../apps/e2e/README.md), then `pnpm test:e2e`                                          |
| Database schema or catalogue             | [Database guide](../../packages/database/README.md), including generation and seed/sync distinctions |
| Container or deployment                  | [Deployment runbook](../deployment.md) and the workflow's image gate                                 |
| Lint configuration                       | [Shared ESLint package](../../packages/config-eslint/README.md)                                      |
| Documentation or agent instructions only | `pnpm format:check`, `pnpm docs:check`, and the manual instruction consistency read below            |

`pnpm test` needs no Docker: server tests start their own in-memory replica set. `pnpm test:db` uses the dedicated Docker test database. `pnpm test:e2e` needs Docker and reseeds its separate E2E database. Read the linked guides before using those database-backed commands.

Documentation-only changes run two tools: `pnpm format:check` (Prettier, which covers Markdown) and `pnpm docs:check` (every relative Markdown link and `#anchor` resolves, so a moved or removed file surfaces here). Instruction consistency has no tool and is a manual read: each guide agrees with [AGENTS.md](../../AGENTS.md) and with the code it describes, every active example matches the implementation, and historical guidance points to the current authority. For routing changes, check both a direct task and a delegated task that starts without its parent's loaded guides.

## CI coverage

The local sequence above corresponds to the workflow's `verify` job; it is not the whole pipeline. CI runs `build`, `lint`, `type-check` and `test` as one `turbo run` graph, so `prisma generate` runs once and the tasks overlap. Only `deploy` restores a Turbo cache; `verify` and `e2e` execute every task on every run. CI also builds the server Docker image and runs Playwright in separate `image` and `e2e` jobs; four jobs in all. On `main`, `image` tags the image by the hash of its inputs and pushes it to the Cloudflare registry unless the registry already holds that tag, in which case it builds nothing; `deploy` waits for all three, deploys that image, then runs `pnpm db:sync` against production and the registry prune listing as its last steps ([deployment runbook](../deployment.md)). Report local checks separately from observed CI results; do not claim an unrun gate passed. Pushes from a cloud session run CI only once the PR exists ([cloud sessions](issue-tracker.md#cloud-sessions)).

## Node upgrades

[.nvmrc](../../.nvmrc) and [apps/server/Dockerfile](../../apps/server/Dockerfile) must name the same major. Raise them together and run:

```bash
nvm use && bash .github/scripts/assert-node-version.sh
```

The script compares the running Node against `.nvmrc` first and exits there on a mismatch, so it only reaches the Dockerfile comparison with the `.nvmrc` Node active. The root `engines.node` floor moves only when the code needs a newer runtime; it need not equal the CI major. Use the root `packageManager` field for the pnpm version. The Dockerfile's `corepack enable` installs that version, and Node 25 no longer ships corepack, so raising the image past Node 24 means installing pnpm another way.
