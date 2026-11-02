import { afterEach, describe, expect, it, vi } from "vitest";

const PRODUCTION_DATABASE_URL =
  "mongodb+srv://user:secret@cluster.mongodb.net/audiophile?retryWrites=true&w=majority&appName=audiophile";

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

  it("names MEDIA_BASE_URL when it is empty", async () => {
    vi.stubEnv("MEDIA_BASE_URL", "");
    await expect(loadEnv()).rejects.toThrow(
      /MEDIA_BASE_URL must be an absolute URL/,
    );
  });

  it("requires CLIENT_URL to be an absolute URL without a trailing slash", async () => {
    vi.stubEnv("CLIENT_URL", "audiophile.t-bendet.com");
    await expect(loadEnv()).rejects.toThrow(
      /CLIENT_URL must be an absolute URL/,
    );

    vi.stubEnv("CLIENT_URL", "https://audiophile.t-bendet.com/");
    await expect(loadEnv()).rejects.toThrow(/CLIENT_URL must not end in \//);
  });

  it("still lists every other invalid variable", async () => {
    vi.stubEnv("JWT_SECRET", "short");
    await expect(loadEnv()).rejects.toThrow(/JWT_SECRET/);
  });

  it("requires EMAIL_FROM to be a bare email address", async () => {
    vi.stubEnv("EMAIL_FROM", "Audiophile <no-reply@audiophile.t-bendet.com>");
    await expect(loadEnv()).rejects.toThrow(/EMAIL_FROM/);
  });

  it("requires EMAIL_API_KEY in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", PRODUCTION_DATABASE_URL);
    vi.stubEnv("EMAIL_API_KEY", undefined);
    await expect(loadEnv()).rejects.toThrow(/EMAIL_API_KEY/);
  });

  it("accepts production once EMAIL_API_KEY is set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", PRODUCTION_DATABASE_URL);
    vi.stubEnv("EMAIL_API_KEY", "re_test_key");
    await expect(loadEnv()).resolves.toBeUndefined();
  });

  it("loads development without EMAIL_API_KEY", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("EMAIL_API_KEY", undefined);
    await expect(loadEnv()).resolves.toBeUndefined();
  });
});
