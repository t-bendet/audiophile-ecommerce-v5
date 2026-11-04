import { base, turboEnvAllowList } from "@repo/eslint-config/base";

export default [
  { ignores: ["worker/worker-configuration.d.ts"] },
  ...base,
  {
    files: ["test/**/*.ts"],
    rules: {
      "turbo/no-undeclared-env-vars": [
        "error",
        // Vitest sets VITEST_POOL_ID inside each worker; it is not a task input.
        { allowList: [...turboEnvAllowList, "VITEST_POOL_ID"] },
      ],
    },
  },
];
