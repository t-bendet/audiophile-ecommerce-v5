import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // The `@/` alias is used throughout src, so tests importing it need the
  // same resolution the app build gets.
  plugins: [tsconfigPaths()],
  test: {
    include: ["test/**/*.test.ts"],
  },
});
