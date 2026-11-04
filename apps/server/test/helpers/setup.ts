import { inject } from "vitest";
import { workerDatabaseUrl } from "./worker-database-url.js";

// `src/utils/env.ts` and the Prisma client both read DATABASE_URL at import
// time, so this worker's database address has to land here, before the first
// test file pulls in the app.
process.env.DATABASE_URL = workerDatabaseUrl(
  inject("databaseUrl"),
  process.env.VITEST_POOL_ID,
);
