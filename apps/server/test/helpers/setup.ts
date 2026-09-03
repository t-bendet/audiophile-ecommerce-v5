import { inject } from "vitest";

// `src/utils/env.ts` and the Prisma client both read DATABASE_URL at import
// time, so the in-memory server's address has to land here, before the first
// test file pulls in the app.
process.env.DATABASE_URL = inject("databaseUrl");
