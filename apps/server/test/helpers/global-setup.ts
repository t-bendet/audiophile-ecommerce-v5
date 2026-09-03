import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import type { TestProject } from "vitest/node";

const run = promisify(execFile);

// Pinned so a run does not silently change engine version; the binary is
// downloaded once at install time and cached globally after that.
const MONGODB_VERSION = "8.2.6";

declare module "vitest" {
  interface ProvidedContext {
    databaseUrl: string;
  }
}

// Prisma refuses to talk to a standalone mongod, so the in-memory server has to
// be a replica set even though a single node is all the suite needs.
const startDatabase = () =>
  MongoMemoryReplSet.create({
    binary: { version: MONGODB_VERSION },
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });

// MongoDB creates collections on first write, but the unique indexes only exist
// once the schema is pushed - and tests assert on the 409 they raise.
const pushSchema = (databaseUrl: string) =>
  run(
    "pnpm",
    [
      "--filter",
      "@repo/database",
      "exec",
      "prisma",
      "db",
      "push",
      "--skip-generate",
    ],
    {
      cwd: fileURLToPath(new URL("../../../..", import.meta.url)),
      // `prisma.config.ts` loads dotenv, and the package's own `.env` points at
      // the real cluster. Pointing dotenv at nothing keeps it out of reach
      // rather than trusting it not to override.
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        DOTENV_CONFIG_PATH: "/dev/null",
      },
    },
  );

export default async function setup({ provide }: TestProject) {
  const replSet = await startDatabase();
  const databaseUrl = replSet.getUri("audiophile-test");

  await pushSchema(databaseUrl);
  provide("databaseUrl", databaseUrl);

  return async () => {
    await replSet.stop();
  };
}
