# @repo/database

Shared Prisma client and schema for the Audiophile E-Commerce monorepo.

## Setup

1. Copy `.env.example` to `.env` and configure your MongoDB Atlas connection string:

```
DATABASE_URL=mongodb+srv://[user]:[password]@[cluster].mongodb.net/[database]?retryWrites=true&w=majority&appName=[appName]
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

## ESM Import Fix

This package includes a post-generation script (`scripts/fix-prisma-imports-robust.cjs`) that patches Prisma's generated client to add `.js` extensions to imports. This is required because:

- The package uses `"type": "module"` (ESM)
- Node.js ESM requires explicit file extensions
- Prisma doesn't add them by default

The script runs automatically after `prisma generate`. See the script file for more details.

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

**Last Updated:** February 10, 2026
