# @repo/database

Shared Prisma client and multi-file schema for the Audiophile E-Commerce monorepo, plus the two
scripts that write the catalogue.

## Setup

Copy `.env.example` to `.env`. It points at the Docker replica set from the repo's
`docker-compose.yml`; `pnpm db:up` at the repo root starts it, and `pnpm db:setup` is a fresh
clone's one command after install.

## Local databases

One Docker MongoDB service serves development, seeding, opt-in route tests, E2E and Compass.
Prisma's nested writes use transactions, so it runs as a single-node replica set, `rs0`.
Port 27017 must be free; stop a competing Homebrew `mongodb-community` service before starting it.

| Use             | Database / connection                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| Development     | `mongodb://localhost:27017/audiophile?replicaSet=rs0&directConnection=true`                              |
| `pnpm test:db`  | `mongodb://localhost:27017/audiophile-test?replicaSet=rs0&directConnection=true` via `TEST_DATABASE_URL` |
| `pnpm test:e2e` | `mongodb://localhost:27017/audiophile-e2e?replicaSet=rs0&directConnection=true`                          |
| Compass         | `mongodb://localhost:27017`                                                                              |

`pnpm test` boots its own in-memory replica set and needs no Docker. Only `TEST_DATABASE_URL`
selects the opt-in route-test database; the test setup ignores an ambient `DATABASE_URL`.
Tests truncate their database, so never set `TEST_DATABASE_URL` to the development database or
Atlas. See the [server testing guide](../../apps/server/README.md) for fixtures and setup.

E2E seeds **before** pushing the schema, because seed drops indexes and push rebuilds them.
Use `pnpm test:e2e` and the [E2E guide](../../apps/e2e/README.md) rather than rearranging those steps.

Before changing the MongoDB version, read [ADR 0004](../../docs/adr/0004-local-mongodb-is-a-docker-replica-set-on-8-2.md).
The Docker image and the route-test setup's `MONGODB_VERSION` must stay aligned.

## Scripts

Run from the repo root; each wraps the matching script here through Turbo.

| Command            | Does                                        | When                                                 |
| ------------------ | ------------------------------------------- | ---------------------------------------------------- |
| `pnpm db:up`       | `docker compose up -d --wait`               | by hand only after a `db:down`; dev and setup run it |
| `pnpm db:down`     | stop and remove the container               | the data volume survives                             |
| `pnpm db:generate` | regenerate the Prisma client                | after any schema change                              |
| `pnpm db:push`     | push the schema to `DATABASE_URL`           | after a schema change, local only                    |
| `pnpm db:seed`     | **drop** the database, then create all      | local only; see below                                |
| `pnpm db:sync`     | upsert the catalogue, preserve user data    | production publication; see below                    |
| `pnpm db:setup`    | up + push + generate + seed                 | fresh clone                                          |
| `pnpm db:reset`    | up + push `--force-reset` + generate + seed | wipe dev data and start over                         |

Inside this workspace, `pnpm studio` opens Prisma Studio, `pnpm format` formats the schema files,
and `pnpm db:deploy` is push + generate without a seed.

## Seeding vs syncing

Two scripts write the catalogue, and the difference matters because one of them is safe to point
at Atlas and the other is not.

`pnpm db:seed` (`src/seed/index.ts`) runs `dropDatabase` and then `create`s everything: six demo
users, the categories, the products, the config. It is the local "give me a clean database"
command and `db:reset` builds on it. Never point it at production: it deletes every user, cart
and order, and because every product is re-created with a fresh `_id`, it also dangles the
`productId` in any order that survived.

`pnpm db:sync` (`src/seed/sync.ts`, logic in `src/seed/catalogue-sync.ts`) writes only what the
repo owns, 3 categories, 6 products and 1 config, as upserts on the unique keys those models
already carry (`Category.name`, `Product.slug`, `Config.name`). A document keeps its `_id`, so
carts and order history keep resolving; nothing is deleted, so a product dropped from the repo is
left in place rather than cascading away cart items; no user is touched. Running it twice changes
nothing, which is what makes it safe to attach to a deploy.

Use it to publish catalogue changes, including changes to catalogue field shapes. It does not
migrate user, cart or order data, or replace a schema/index change plan:

```bash
DATABASE_URL='mongodb+srv://...' pnpm db:sync
```

`dotenv` never overrides an already-set variable, so the prefix wins over this workspace's `.env`
and no production credential has to be written to a file.

CI runs it for you: the `sync-catalogue` job in `.github/workflows/ci.yml` needs `deploy` and runs
`db:sync` against the `DATABASE_URL` repository secret. Without that secret the job logs a warning
and skips, so the catalogue simply stays a manual step rather than failing a good deploy.

A breaking shape change can leave new code unable to read old rows, or a reverted reader unable
to read synced rows. Deployment precedes sync, so compatibility matters during that interval.
Avoid the gap by shipping a reader that accepts both shapes, syncing, then removing the old
branch. A successful code rollback does not reverse persisted data. See the
[deployment runbook](../../docs/deployment.md) for the pipeline and recovery path.

## Schema organization

One file per model under `prisma/schema/`: `schema.prisma` holds the datasource and generator,
then `user`, `product`, `category`, `cart`, `order`, `config` and `image` (the embedded image
types). Prisma merges them; add a model by adding a file.

Run `pnpm db:generate` after every schema change. Build database and domain packages before
checking consumers when generated or shared types have changed; root `pnpm build` enforces the
dependency order.

## ESM imports

The `prisma-client` generator is configured with `importFileExtension = "js"` (alongside
`runtime = "nodejs"` and `moduleFormat = "esm"`), so the generated client's relative imports
already carry the `.js` extensions Node.js ESM requires. No post-generation patching is needed;
see the generator block in `prisma/schema/schema.prisma`.

## Usage in other packages

```typescript
import { prisma, Prisma } from "@repo/database";

const users = await prisma.user.findMany();

type UserWithOrders = Prisma.UserGetPayload<{
  include: { orders: true };
}>;
```
