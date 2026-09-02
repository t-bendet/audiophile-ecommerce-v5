# `@repo/eslint-config`

Shared **flat** ESLint config for the monorepo.

```js
// eslint.config.js
import { base } from "@repo/eslint-config/base";

export default [...base];
```

`base` is a `tseslint.config(...)` array combining `@eslint/js` recommended,
`typescript-eslint` recommended, `eslint-config-turbo`, `eslint-config-prettier`
and the `only-warn` plugin. It ignores `dist/` and `generated/` and assumes Node
globals; packages layer their own ignores, globals and rules on top.

`turboEnvAllowList` is also exported: the env vars that are ambient here rather
than turbo-tracked build inputs. Packages needing extras spread it rather than
restating it — see `apps/client`, which adds Vite's `import.meta.env` names.

## Warning budgets

`only-warn` downgrades every rule to a warning, so rule severities in the config
are nominal and lint would never fail on its own. Enforcement comes from each
package's budget instead:

```json
"lint": "eslint . --max-warnings 61"
```

The number is that package's warning count at the time of the ESLint 9 flat-config
migration. It is a **ratchet**: a new warning pushes the count over budget and
fails the build, while the existing backlog stays visible instead of being
silenced. Lower the number as warnings are burned off; never raise it.
