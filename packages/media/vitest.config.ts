import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // cli.test.ts writes into the real tree, which every file here reads.
    fileParallelism: false,
  },
});
