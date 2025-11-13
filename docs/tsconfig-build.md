Why add a `tsconfig.build.json` for a package?

- Purpose: `tsconfig.build.json` is a minimal/explicit TypeScript configuration used when compiling a package for distribution. It focuses on emit options (target, module resolution, output directory) and excludes dev-only files (tests, stories, internal src not intended for consumers).
- Benefits:
  - Avoids shipping source-mapping and dev-only files.
  - Ensures a reproducible `dist/` layout that other packages or consumers can import.
  - Keeps `tsconfig.json` focused on editor/dev ergonomics while `tsconfig.build.json` focuses on build outputs.

Typical patterns and recommendations

1. Base vs build config

- Keep a base `tsconfig.json` for development (paths, composite, project references, strict checks).
- Add `tsconfig.build.json` which extends the base but overrides `outDir`, `declaration`, `sourceMap`, and `module` for the build.

2. Example `tsconfig.build.json` for ESM/NodeNext packages

```json
{
  "extends": "../../packages/config-typescript/nextjs.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "emitDeclarationOnly": false,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["**/*.spec.ts", "**/__tests__/**"]
}
```

Notes:

- `module: NodeNext` + package.json `type: "module"` allows tsc to emit ESM output with proper import semantics.
- When using NodeNext you must ensure local imports include `.js` extensions in emitted JS (either by authoring imports with `.js` or post-processing generated files). Many projects solve that by authoring TypeScript imports with `.js` (tsc will keep them) or by a small post-build script that rewrites relative imports to end with `.js`.

3. When targeting CommonJS (older ecosystems)

- Use `module: "CommonJS"` and `target: "ES2019"` (or similar).
- Ensure package `exports` main points to the compiled CommonJS entry.

4. Declarations and types

- Set `declaration: true` so consumers get `.d.ts` files alongside compiled `.js` files.
- Point `package.json.types` (or `exports.types`) to the generated `dist/` declaration file.

5. Recommendations for monorepos

- Keep per-package `tsconfig.build.json` so each package can be built independently by your monorepo tool (turbo/pnpm). Extending a shared base config prevents drift.
- Ensure the `build` script runs `tsc -p tsconfig.build.json` and that `prebuild`/`postbuild` scripts handle codegen (e.g., `prisma generate`) and small post-processing steps (adding .js extensions for ESM if needed).

6. Quick checklist for moving to ESM/NodeNext

- package.json: add `"type": "module"` for the package if you want emitted `.js` to be treated as ESM.
- Source imports: either author local imports with `.js` (so emitted JS keeps them), or add a post-build step that rewrites compiled JS relative imports to include `.js`.
- Test `node dist/index.js` with the target Node version to ensure runtime resolution matches expectations.

If you want, I can add a sample `tsconfig.build.json` to a specific package in this repo (e.g., `apps/server/tsconfig.build.json`) and wire it into the `build` script. Tell me which package to target and whether you prefer ESM (NodeNext) or CommonJS output.
