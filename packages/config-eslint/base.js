import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboConfig from "eslint-config-turbo/flat";
import onlyWarn from "eslint-plugin-only-warn";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Env vars that are ambient in every runtime here rather than turbo-tracked
 * build inputs. Packages with extras of their own spread this rather than
 * restating it — see `apps/client`, which adds Vite's `import.meta.env` names.
 */
export const turboEnvAllowList = ["NODE_ENV"];

/**
 * Shared flat ESLint config for every workspace in the monorepo.
 *
 * Consumers spread this into their own `eslint.config.js` and layer
 * package-specific ignores, globals and rules on top.
 *
 * The `only-warn` plugin downgrades every rule to a warning, so severities
 * below are nominal; enforcement comes from each package's
 * `--max-warnings <n>` budget instead. See the README.
 */
export const base = tseslint.config(
  {
    ignores: ["dist/**", "generated/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      turboConfig,
      eslintConfigPrettier,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "only-warn": onlyWarn,
    },
    rules: {
      "turbo/no-undeclared-env-vars": [
        "error",
        { allowList: turboEnvAllowList },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
);
