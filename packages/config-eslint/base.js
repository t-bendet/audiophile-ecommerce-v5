import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboConfig from "eslint-config-turbo/flat";
import onlyWarn from "eslint-plugin-only-warn";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Shared flat ESLint config for every workspace in the monorepo.
 *
 * Consumers spread this into their own `eslint.config.js` and layer
 * package-specific ignores and rules on top.
 */
export const base = tseslint.config(
  {
    ignores: ["dist/**", "generated/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
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
      // NODE_ENV is ambient in every runtime here, not a turbo-tracked input.
      "turbo/no-undeclared-env-vars": ["error", { allowList: ["NODE_ENV"] }],
    },
  },
);

export default base;
