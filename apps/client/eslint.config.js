import { base, turboEnvAllowList } from "@repo/eslint-config/base";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  ...base,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "turbo/no-undeclared-env-vars": [
        "error",
        // DEV/MODE are Vite's build-time `import.meta.env` constants rather
        // than process env, so turbo has nothing to track for them.
        { allowList: [...turboEnvAllowList, "DEV", "MODE"] },
      ],
    },
  },
];
