import { afterEach, describe, expect, it, vi } from "vitest";

const loadEnv = async () => {
  vi.resetModules();
  await import("../src/utils/env.js");
};

describe("env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  // Stubbed empty rather than deleted: `env.ts` runs dotenv at import, which
  // would refill a deleted variable from the package's `.env`.
  it("tells the developer how to supply DATABASE_URL when it is empty", async () => {
    vi.stubEnv("DATABASE_URL", "");
    await expect(loadEnv()).rejects.toThrow(
      /Missing or invalid DATABASE_URL[\s\S]*\.env\.example[\s\S]*pnpm db:up/,
    );
  });

  it("says the same when DATABASE_URL has the wrong shape", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://localhost/audiophile");
    await expect(loadEnv()).rejects.toThrow(/Missing or invalid DATABASE_URL/);
  });

  it("still lists every other invalid variable", async () => {
    vi.stubEnv("JWT_SECRET", "short");
    await expect(loadEnv()).rejects.toThrow(/JWT_SECRET/);
  });
});
