/**
 * Prisma configuration file (migrated from package.json "prisma" property).
 * Prisma CLI will read this file (prisma.config.ts) in newer Prisma versions.
 * Keep schema path relative to this package root.
 */

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
