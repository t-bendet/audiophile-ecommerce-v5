# @repo/database

Shared Prisma client and schema for the Audiophile E-Commerce monorepo.

## Setup

1. Copy `.env.example` to `.env`; it points at the Docker replica set from the repo's `docker-compose.yml` (`docker compose up -d --wait` at the repo root):

```
DATABASE_URL=mongodb://localhost:27017/audiophile?replicaSet=rs0&directConnection=true
```

2. Run the appropriate setup command (see below).

## Scripts

### Database Commands

| Command          | Description                   | When to use                                        |
| ---------------- | ----------------------------- | -------------------------------------------------- |
| `pnpm db:setup`  | Push schema + generate + seed | **Fresh DB** - First deployment or new environment |
| `pnpm db:deploy` | Push schema + generate        | **Production** - Schema changes (preserves data)   |
| `pnpm db:reset`  | Force reset + generate + seed | **Development only** - Wipes all data!             |

### Individual Commands

| Command            | Description                                  |
| ------------------ | -------------------------------------------- |
| `pnpm db:generate` | Generate Prisma client (with ESM import fix) |
| `pnpm db:push`     | Sync schema to database                      |
| `pnpm db:seed`     | Run seed scripts                             |
| `pnpm studio`      | Open Prisma Studio GUI                       |
| `pnpm format`      | Format Prisma schema files                   |

### Build Commands

| Command            | Description                           |
| ------------------ | ------------------------------------- |
| `pnpm build`       | Generate client + compile TypeScript  |
| `pnpm build:watch` | Watch mode for TypeScript compilation |
| `pnpm dev`         | Alias for `db:generate`               |

## Schema Organization

Multi-file schema located in `prisma/schema/`:

```
prisma/schema/
├── schema.prisma   # Datasource, generator config
├── user.prisma     # User model
├── product.prisma  # Product model
├── category.prisma # Category model
└── config.prisma   # App config model
```

## ESM Imports

The `prisma-client` generator is configured with `importFileExtension = "js"` (alongside `runtime = "nodejs"` and `moduleFormat = "esm"`), so the generated client's relative imports already carry `.js` extensions. This is required because:

- The package uses `"type": "module"` (ESM)
- Node.js ESM requires explicit file extensions

No post-generation patching is needed — see `prisma/schema/schema.prisma` for the generator block.

## Usage in Other Packages

```typescript
import { prisma, Prisma } from "@repo/database";

// Use the client
const users = await prisma.user.findMany();

// Use Prisma types
type UserWithOrders = Prisma.UserGetPayload<{
  include: { orders: true };
}>;
```

**Last Updated:** September 4, 2026
