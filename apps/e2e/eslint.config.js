import { base, turboEnvAllowList } from "@repo/eslint-config/base";

export default [
  {
    ignores: [
      "playwright-report/**",
      "test-results/**",
      "blob-report/**",
      "playwright/.auth/**",
    ],
  },
  ...base,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "turbo/no-undeclared-env-vars": [
        "error",
        { allowList: [...turboEnvAllowList, "CI"] },
      ],
    },
  },
];
