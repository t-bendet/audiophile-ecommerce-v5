# `@repo/eslint-config`

Shared **flat** ESLint config for the monorepo.

```js
// eslint.config.js
import { base } from "@repo/eslint-config/base";

export default [...base];
```

`base` is a `tseslint.config(...)` array combining `@eslint/js` recommended,
`typescript-eslint` recommended, `eslint-config-turbo`, `eslint-config-prettier`,
and the `only-warn` plugin. It ignores `dist/` and `generated/` and assumes Node
globals; packages layer their own ignores, globals and rules on top.
