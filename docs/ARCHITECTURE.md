# Architecture

Audiophile is a single-brand storefront. Use the [glossary](../GLOSSARY.md) for domain terms and
[ADRs](adr/) for the reasons behind durable design choices. This page maps the system;
implementation conventions live in the guides linked below.

## Workspaces and dependencies

```text
packages/database → packages/domain → apps/server
                                    → apps/client

apps/e2e        drives the built apps over HTTP; imports no application packages
packages/media catalogue originals and publication tools; no runtime consumers
```

Turborepo orders builds through the workspace dependency graph. pnpm provides workspace linking;
the shared ESLint and TypeScript packages hold tooling configuration. The package manifests and
[`turbo.json`](../turbo.json) are authoritative for dependencies and task ordering.

## Request and data boundaries

The Express API owns authentication, validation, persistence and DTO mapping. Input routes bind
a request schema to a controller with `defineHandler`, which supplies validation and async error
handling together. Controllers consume `req.verified`; services encapsulate domain behavior and
Prisma access where that abstraction is useful. Simple pass-through CRUD can go directly from a
controller to Prisma. Errors reach one centralized response/logging boundary.

[`apps/server/README.md`](../apps/server/README.md) defines the request lifecycle, service
contracts, error handling and route-test seam. Shared request schemas, DTOs and semantic error
codes live in `packages/domain`; the public exports are in its `src/index.ts`.

MongoDB stores document-shaped catalogue data, including embedded image variants. Image variants
hold **keys and dimensions**, not public URLs. The API resolves each key against `MEDIA_BASE_URL`
when constructing DTOs. The [media guide](../packages/media/README.md) owns key conventions and
publication; the [database guide](../packages/database/README.md) owns schemas, client generation,
local databases and catalogue sync.

Prisma's nested writes require MongoDB transactions, so local development uses a Docker replica
set. Atlas is the production database. The repo authors the catalogue; catalogue sync updates it
without deleting shoppers' users, carts or orders. Destructive seeding is for local databases.

## Client and browser state

The React client uses React Router loaders and lazy route modules with TanStack Query for server
state. Query-option factories let loaders and components share cache keys and fetch functions.
Requests use the lazy Axios client with credentials enabled. Axios rejects raw errors; query and
UI layers classify them and choose retry, inline, toast or boundary behavior.

[`apps/client/README.md`](../apps/client/README.md) defines those conventions and the current error
flow. The router is `apps/client/src/app/router.tsx`. Authentication checks live in loaders; the
navigation middleware measures development performance.

A guest cart lives in the browser. Signing in syncs it with the user's server cart. Orders retain
prices from checkout, rather than recalculating old purchases at the catalogue's current price.
The glossary distinguishes cart sync from catalogue sync and media sync.

## Authentication and protection

The server accepts JWTs from an HTTP-only cookie or the Authorization header. Protected requests
validate the token and reject tokens issued before a user's password change. Authorization and
ownership checks control access to protected operations and records.

Request schemas reject unknown fields, persistence rules protect writes, and DTOs control the
read shape. Helmet, request size limits and rate limiters are configured in the server; inspect
[`app.ts`](../apps/server/src/app.ts) and its imported middleware for current limits. Rate-limit
failures use the same error envelope as other API failures. Test environments disable the
limiters, with their behavior covered separately by the route suite.

## Verification boundaries

- Server route tests drive the real Express app and an isolated MongoDB replica set. They cover
  validation, auth, persistence and response behavior.
- Client tests cover browser-side behavior without deploying the system.
- [E2E tests](../apps/e2e/README.md) drive the built client and server through HTTP with their own
  ports and seeded database. Fixtures keep test state independent of application internals.
- Media checks compare catalogue references, the assets tree and the committed manifest.

The [verification guide](agents/verification.md) maps changes to checks and CI coverage.

## Hosting

```text
audiophile.t-bendet.com
  /api/* → Worker → Cloudflare Container (Express) → Atlas
  /*     → Workers Static Assets (Vite build, SPA fallback)

audiophile-media.t-bendet.com → R2 bucket
```

API paths reach the Worker before asset lookup, so an unknown API route returns JSON rather than
the app shell. Sharing the application hostname keeps authentication cookies same-origin.
Catalogue media is separate from UI chrome, which stays bundled with the client.

The [deployment runbook](deployment.md) owns environments, CI gates, manual deployment, local
container checks and recovery. [ADR 0005](adr/0005-audiophile-runs-on-cloudflare-under-t-bendet-com.md)
records why this repository uses Cloudflare Containers with Atlas.
