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
```

Generate the Prisma client with `pnpm db:generate` after a schema change or on a fresh checkout before building. Turbo builds dependencies in order; when workspace types are missing, build `packages/database` and `packages/domain` before their consumers. For focused commands, use the script names in the workspace's `package.json` with `pnpm --filter <workspace> run <script>`.

| Change                                   | Additional guidance                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Server behavior                          | [Server tests and database isolation](../../apps/server/README.md)                                                        |
| Client behavior                          | [Client tests and error handling](../../apps/client/README.md)                                                            |
| Shared domain contract                   | Domain tests plus consumer type-checks; [domain guide](domain.md)                                                         |
| Browser journeys                         | [E2E guide](../../apps/e2e/README.md), then `pnpm test:e2e`                                                               |
| Database schema or catalogue             | [Database guide](../../packages/database/README.md), including generation and seed/sync distinctions                      |
| Container or deployment                  | [Deployment runbook](../deployment.md) and the workflow's image gate                                                      |
| Lint configuration                       | [Shared ESLint package](../../packages/config-eslint/README.md)                                                           |
| Documentation or agent instructions only | Format changed Markdown, verify local links and removed-file references, and walk relevant task routes and skill handoffs |

`pnpm test` needs no Docker: server tests start their own in-memory replica set. `pnpm test:db` uses the dedicated Docker test database. `pnpm test:e2e` needs Docker and reseeds its separate E2E database. Read the linked guides before using those database-backed commands.

For documentation-only changes, application tests do not validate prose. Check that every moved instruction has a reachable destination, every active example matches the implementation, and historical guidance points to the current authority. For routing changes, check both a direct task and a delegated task that starts without its parent's loaded guides.

## CI coverage

The local sequence above corresponds to the workflow's `verify` job; it is not the whole pipeline. CI also builds the server Docker image and runs Playwright in separate `image` and `e2e` jobs. Deployment on `main` waits for all three. Report local checks separately from observed CI results; do not claim an unrun gate passed.

## Node upgrades

[.nvmrc](../../.nvmrc) and [apps/server/Dockerfile](../../apps/server/Dockerfile) must name the same major. Raise them together and run:

```bash
bash .github/scripts/assert-node-version.sh
```

The root `engines.node` floor moves only when the code needs a newer runtime; it need not equal the CI major. Use the root `packageManager` field for the pnpm version.
