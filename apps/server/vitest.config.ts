import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    globalSetup: ["./test/helpers/global-setup.ts"],
    setupFiles: ["./test/helpers/setup.ts"],
    // Every file talks to the same in-memory database and truncates it between
    // tests, so they cannot run side by side.
    fileParallelism: false,
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.typecheck.json",
    },
    // `src/utils/env.ts` validates process.env at import time, and `app.ts`
    // imports it, so every value the schema requires has to be present before
    // the first test file loads. DATABASE_URL is the exception: the global
    // setup boots an in-memory replica set (or takes TEST_DATABASE_URL) and
    // `test/helpers/setup.ts` injects its address. dotenv never overrides an
    // existing variable, so a local `.env` cannot leak into a test run.
    env: {
      NODE_ENV: "test",
      PORT: "8000",
      JWT_SECRET: "test-secret-that-is-at-least-32-characters",
      JWT_EXPIRES_IN: "90d",
      JWT_COOKIE_EXPIRES_IN: "1",
    },
  },
});
