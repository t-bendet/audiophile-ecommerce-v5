import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "es2022",
  outDir: "dist",
  sourcemap: true,
  clean: true,
  bundle: true,
  splitting: false,
  treeshake: true,
  skipNodeModulesBundle: true,
  platform: "node",
  external: ["@repo/database", "@repo/domain", "@repo/validators"],
  noExternal: [],
  dts: false, // Skip .d.ts generation to save memory
  minify: false,
  shims: false,
});
