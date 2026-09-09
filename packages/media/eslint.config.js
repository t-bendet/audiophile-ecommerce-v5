import { base, turboEnvAllowList } from "@repo/eslint-config/base";

export default [
  ...base,
  {
    files: ["src/scripts/**/*.ts"],
    rules: {
      // The sync script reads its R2 credentials from the developer's shell,
      // not from a turbo-tracked build input.
      "turbo/no-undeclared-env-vars": [
        "error",
        {
          allowList: [
            ...turboEnvAllowList,
            "R2_ACCOUNT_ID",
            "R2_ACCESS_KEY_ID",
            "R2_SECRET_ACCESS_KEY",
            "R2_BUCKET",
          ],
        },
      ],
    },
  },
];
