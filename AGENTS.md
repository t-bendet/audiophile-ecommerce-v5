# Agent instructions

This is the shared entrypoint for coding agents. Read the task guides below before changing their area; load only the guides relevant to the task. Claude and Copilot entrypoints point here.

## Repository map

This pnpm/Turborepo monorepo builds `packages/database` → `packages/domain` → `apps/server` and `apps/client`. The server is Express; the client is React. `apps/e2e` tests both over HTTP without importing workspace code. `packages/media` owns catalogue image originals and publication scripts. Shared lint and TypeScript configuration lives in `packages/config-*`.

For cross-package exploration, read [architecture](docs/ARCHITECTURE.md). Package manifests and configuration are authoritative for installed versions and available commands.

## Working rules

- Work on a branch based on `main`: `<type>/<issue#>-<slug>` for a ticket, `<type>/<slug>` for direct housekeeping requests. PRs target `main`; a push to `main` deploys. Read the [Git and issue workflow](docs/agents/issue-tracker.md) before ticket operations, commits, or PRs.
- Use names and structure to explain code. Add a short comment only for a non-obvious constraint or to match an existing commented section. Design rationale belongs in an ADR.
- Keep each convention in its task guide. Update that guide when behavior changes; this file holds shared rules and routing, not copies of implementation examples.
- Before handing off a change, use the [verification guide](docs/agents/verification.md) to select checks and report what ran and any remaining failures. Documentation-only work needs formatting, links, and instruction consistency checks.

## Data boundaries

`db:seed`, `db:setup`, and `db:reset` are destructive local-database operations. Never point them at Atlas. Test helpers also truncate data: use the dedicated test databases, never development or production data. Read the [database guide](packages/database/README.md) before schema changes, database commands, or changing seed/sync behavior. Production catalogue updates use `db:sync`, which preserves users, carts, and orders.

## Task guides

| Before working on…                                                     | Read                                                             |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Server routes, validation, services, logging, or route tests           | [Server guide](apps/server/README.md)                            |
| Client UI, data fetching, errors, routing, or client tests             | [Client guide](apps/client/README.md)                            |
| Shared schemas, DTOs, exports, domain terminology, or design decisions | [Domain guide](docs/agents/domain.md)                            |
| Database schema/client generation, seeding, sync, or MongoDB versions  | [Database guide](packages/database/README.md)                    |
| E2E tests, failures, traces, or Playwright agent regeneration          | [E2E guide](apps/e2e/README.md)                                  |
| Catalogue images, image keys, import, or publication                   | [Media guide](packages/media/README.md)                          |
| Deployment, Worker configuration, secrets, or CI changes               | [Deployment runbook](docs/deployment.md)                         |
| Check selection, build failures, or Node upgrades                      | [Verification guide](docs/agents/verification.md)                |
| Issues, specs, branches, commits, or PRs                               | [Issue workflow](docs/agents/issue-tracker.md)                   |
| Issue triage or label changes                                          | [Triage labels](docs/agents/triage-labels.md)                    |
| Skills or agent instructions                                           | [Writing for agents](.agents/skills/writing-for-agents/SKILL.md) |

Task skills live in `.agents/skills`; Claude aliases share those sources. A delegated agent should read the relevant task guides too. Research documents record past investigations; follow their current-guide links for implementation and operations. Local environment variables are documented in each workspace's `.env.example`.
