import { defineConfig } from "vitest/config";

export default defineConfig({
  // The `@/` alias is used throughout src, so tests importing it need the
  // same resolution the app build gets.
  resolve: { tsconfigPaths: true },
  test: {
    include: ["test/**/*.test.ts"],
  },
});
