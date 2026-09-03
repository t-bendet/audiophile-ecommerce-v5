import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.typecheck.json",
    },
    // `src/utils/env.ts` validates process.env at import time, and `app.ts`
    // imports it, so every value the schema requires has to be present before
    // the first test file loads. These are placeholders: no test connects to
    // the database or signs a token, and dotenv never overrides an existing
    // variable, so a local `.env` cannot leak into a test run.
    env: {
      NODE_ENV: "test",
      PORT: "8000",
      DATABASE_URL:
        "mongodb+srv://user:pass@cluster.example.net/test?retryWrites=true&w=majority&appName=test",
      JWT_SECRET: "test-secret-that-is-at-least-32-characters",
      JWT_EXPIRES_IN: "90d",
      JWT_COOKIE_EXPIRES_IN: "1",
    },
  },
});
