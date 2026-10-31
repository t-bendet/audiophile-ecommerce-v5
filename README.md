# Audiophile E-Commerce

A full-stack TypeScript portfolio project based on the Frontend Mentor Audiophile design. Browse headphones, speakers, and earphones; manage a persistent cart; sign in; check out; and review your orders.

[Live application](https://audiophile.t-bendet.com) · [API health](https://audiophile.t-bendet.com/api/v1/health) · [Issues](https://github.com/t-bendet/audiophile-ecommerce-v5/issues)

The API container sleeps when idle, so the first request after a quiet period can take a few seconds.

## Project structure

The pnpm/Turborepo workspace contains:

| Path                | Responsibility                                               |
| ------------------- | ------------------------------------------------------------ |
| `apps/client`       | React storefront, React Router, TanStack Query, Tailwind CSS |
| `apps/server`       | Express API and Cloudflare Worker/container entrypoint       |
| `apps/e2e`          | Playwright tests driving the built applications over HTTP    |
| `packages/database` | Prisma schema/client and MongoDB catalogue seed/sync         |
| `packages/domain`   | Shared schemas, types, DTOs, and error codes                 |
| `packages/media`    | Catalogue image originals and R2 publication                 |
| `packages/config-*` | Shared lint and TypeScript configuration                     |

See [architecture](docs/ARCHITECTURE.md) for boundaries and [ADRs](docs/adr/) for design decisions. Package manifests contain current dependency versions.

## Getting started

Use the Node major in [.nvmrc](.nvmrc), the pnpm version in [package.json](package.json), and Docker for the local MongoDB replica set. Atlas is used for production, not local setup.

```bash
git clone https://github.com/t-bendet/audiophile-ecommerce-v5.git
cd audiophile-ecommerce-v5
nvm use
pnpm install
```

Copy the workspace examples and fill in their documented values:

```bash
cp packages/database/.env.example packages/database/.env
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
```

The database and server examples point to the local Docker database. Set the server's `JWT_SECRET` to at least 32 characters. Image publication additionally uses `packages/media/.env.example`; its credentials are unnecessary for normal app development. Keep local secrets out of version control.

For a fresh local database:

```bash
pnpm db:setup
pnpm dev
```

`db:setup` starts MongoDB, pushes the schema, generates Prisma, and seeds demo data. **It replaces the local database contents.** Read the [database guide](packages/database/README.md) before resetting data or changing the target database.

Development addresses:

- Client: http://localhost:5173
- API: http://localhost:8000/api/v1
- Health: http://localhost:8000/api/v1/health

Use `pnpm dev:client` or `pnpm dev:server` to run one app. The server command starts the database first. `pnpm build` builds all workspaces in dependency order; `pnpm prod:client` and `pnpm prod:server` run the built apps locally. See root and workspace `package.json` files for the full command list.

## Working on the project

Read [AGENTS.md](AGENTS.md) for shared rules and task routing. The focused guides are:

- [Server implementation and tests](apps/server/README.md)
- [Client implementation and tests](apps/client/README.md)
- [Shared domain contracts and terminology](docs/agents/domain.md)
- [Database setup, schema, seed, and sync](packages/database/README.md)
- [E2E tests and Playwright maintenance](apps/e2e/README.md)
- [Catalogue images](packages/media/README.md)
- [Verification and Node upgrades](docs/agents/verification.md)
- [Roadmap of planned and candidate features](docs/ROADMAP.md)

For contribution branches, commits, and PRs, use the [issue workflow](docs/agents/issue-tracker.md). Feature requests and planned work live in [GitHub Issues](https://github.com/t-bendet/audiophile-ecommerce-v5/issues). Research in `docs/research` records past investigations; current implementation and operations follow the guides above.

## Deployment

A Cloudflare Worker serves the client and forwards API requests to an Express container. MongoDB Atlas stores application data; Cloudflare R2 serves catalogue images. A push to `main` deploys after CI passes, then syncs the catalogue.

Read the [deployment runbook](docs/deployment.md) before manual deployment, Worker configuration or secret changes, or CI changes. It covers local Worker testing, environment sources, deployment gates, and provisioning another instance.

## License

MIT License - Copyright (c) 2026 Tal Bendet

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.

Feel free to use this code for learning, inspiration, or your own projects!

## Credits and contact

Design inspired by [Frontend Mentor's Audiophile challenge](https://www.frontendmentor.io/). Built by [Tal Bendet](https://github.com/t-bendet) with the open-source projects named in the workspace manifests.
