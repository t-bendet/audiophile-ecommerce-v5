# Playwright Agents in the first E2E ticket — research note

> Historical setup research. The harness and agents are now installed; proposed commands,
> model choices and tool availability below reflect the investigation date. Use the
> [E2E agent workflow and regeneration instructions](../../apps/e2e/README.md#agents) for maintenance.

Written 2026-10-12 against `@playwright/test` 1.64.0, as a follow-up to `playwright-e2e.md`. One
decision: run `npx playwright init-agents --loop=claude` (and `init-skills --loop claude`) in the
first E2E ticket, or ship a hand-written harness first and add the agents after. Primary sources
only; URLs in the "Verification trail". Nothing in the repo was modified except this file.

## Recommendation

**Ship the harness first; add the agents in the ticket right after, not in the same one.** The
order is forced by the tool itself, not by caution: `init-agents` loads `playwright.config.ts`
(`configLoader.loadConfigFromFile`) and picks a project from it before it writes anything, and the
agent definitions are a thin layer (three Markdown files, one `.mcp.json`) that takes a minute to
regenerate. What the agents need to be useful — fixtures, a seed spec importing them, a running
`webServer`, seeded users — is exactly the harness. The only cost of splitting is one extra PR.

| Option                                                  | For                                                                                                                                                                                                              | Against                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. `init-agents` + `init-skills` in the first ticket    | Docs present the agents as built in ("out of the box"), not experimental; generated files are small and inspectable; the planner can explore the app the moment `webServer` works.                               | `init-agents` cannot run before the config exists, so it is step N, not step 1, either way. The default seed spec it writes is a bare `@playwright/test` import inside `test.describe` — it must be hand-edited to import `./fixtures`. `.mcp.json` is overwritten whole on every regeneration. Two unproven things (harness, agent loop) fail together, and the healer edits tests unattended. |
| B. Harness first (per `playwright-e2e.md`), agents next | One ticket proves config, auth setup, seeding, CI on their own; the agents ticket is then one command plus two edits and is easy to review and to revert; the seed-file edit and `.mcp.json` merge are explicit. | One more PR; the first flows are written by hand (or by the main Claude session with `@playwright/mcp`), without the planner's exploration.                                                                                                                                                                                                                                                     |

Concretely for the second ticket: commit `.claude/agents/*.md` and `.mcp.json` as generated,
replace the generated `seed.spec.ts` body with one that imports from `./fixtures` (the page's own
example), add the `@playwright/mcp` server to `.mcp.json` by hand after generation, run
`init-skills` for `playwright-trace`, and document "re-run both, re-apply the `.mcp.json` merge"
in the upgrade step. Do not run several healers in parallel (#39235/#39236: "not a supported
scenario").

> **Status (2026-10):** Done in #259 with one difference: the agents are committed with repository
> edits (listed under "Regenerating them" in `apps/e2e/README.md`), and no `@playwright/mcp` entry
> was added to `.mcp.json`.

## Findings

### 1. How the docs position Agents

The test-agents page uses neither "recommended", "optional" nor "experimental". Its framing:
"Playwright comes with three Playwright Test Agents out of the box: 🎭 planner, 🎭 generator and
🎭 healer", which "can be used independently, sequentially, or as the chained calls in the agentic
loop". Setup wording: "Start with adding Playwright Test Agent definitions to your project using
the `init-agents` command. These definitions should be regenerated whenever Playwright is updated
to pick up new tools and instructions." The intro page still documents `pnpm create playwright`
as the way to start a project; the agents page never claims to replace it. The 1.56 release notes
hedge only about VS Code: "It will become stable shortly, we are a bit ahead of times with this
functionality!" So: an additive, supported feature on top of a normal project, not the authoring
workflow and not labelled experimental.

### 2. Order of operations and the seed spec

`init-agents` (program.ts, v1.64.0) runs `configLoader.loadConfigFromFile(opts.config)` and
`seedProject(fullConfig, projectName)` — "Project to use for seed test" — before any write; with
no `--project` it takes `findTopLevelProjects(fullConfig)[0]`. A `playwright.config.ts` with at
least one project is therefore a precondition. `findTopLevelProjects` returns only projects that no
other project depends on: `buildProjectsClosure` in `lib/runner/index.js` marks anything reached
through `dependencies` as `dependency`, not `top-level`. In this repo's config `setup` is a
dependency of `chromium`, so `chromium` is chosen without `--project`, which is why the
regeneration command in `apps/e2e/README.md` omits the flag.

The seed file: `findSeedFile` scans the project's files for any basename containing `seed` and
leaves an existing one alone; otherwise it writes `<testDir>/seed.spec.ts` with exactly:

```ts
import { test, expect } from "@playwright/test";
test.describe("Test group", () => {
  test("seed", async ({ page }) => {
    // generate code here.
  });
});
```

The docs example instead imports `test, expect` from `./fixtures` ("Seed tests provide a
ready-to-use `page` context to bootstrap execution"), and the planner's listed inputs are "A clear
request to the planner", "A `seed test` that sets up the environment necessary to interact with
your app", and an optional PRD. So the fixtures module and the edited seed are things the author
supplies; the generator does not create them. `specs/README.md` is written only if `specs/` is
absent. Two known limits: `test_debug` only pauses with the built-in `page` fixture — the
maintainer's advice is "decorate the default page instead of replacing it" (#38332, closed
v1.60); custom `test.extend` fixtures broke the MCP tools in 1.56 (#38109, closed).

### 3. What `init-agents --loop=claude` writes at v1.64.0

From `generateAgents.ts` and the three `*.agent.md` files at tag v1.64.0:

- `.claude/agents/playwright-test-planner.md`, `playwright-test-generator.md`,
  `playwright-test-healer.md`. Frontmatter: `name`, `description` (plus appended
  `Examples: <example>…</example>`), `tools`, `model: sonnet`, `color` (green/blue/red).
  `tools` is a comma-joined string: `search` → `Glob, Grep, Read, LS`; `edit` (healer only) →
  `Edit, MultiEdit, Write`; `playwright-test/<x>` → `mcp__playwright-test__<x>`. Planner gets
  browser tools plus `planner_setup_page`/`planner_save_plan`; generator gets browser +
  `browser_verify_*` + `generator_setup_page`/`generator_read_log`/`generator_write_test`; healer
  gets `test_list`/`test_run`/`test_debug`, `browser_generate_locator` and edit tools.

  > **Status (2026-10):** Committed as generated except `model`: only the healer is
  > `model: inherit`; the planner and generator stay `sonnet` (`.claude/agents/*.md`).

- `.mcp.json`: `JSON.stringify({ mcpServers: { 'playwright-test': { command: 'npx', args:
['playwright', 'run-test-mcp-server'] } } })` — **written unconditionally, no merge** (the VS
  Code generator merges `.vscode/mcp.json`; the Claude one does not). The shared `writeFile`
  helper has no existence check, so the three agent files are overwritten too.
- `.claude/prompts/*.md` only with `--prompts`.
- Nothing reads or writes `.claude/skills` or `.claude/settings*.json`.

This repo has `.claude/skills/` and `.claude/settings.local.json` and no `.claude/agents` or
`.mcp.json`, so a first run collides with nothing; later runs clobber `.mcp.json`.

> **Status (2026-10):** Both now exist. `.mcp.json` runs
> `node apps/e2e/node_modules/@playwright/test/cli.js run-test-mcp-server --config apps/e2e/playwright.config.ts`
> rather than `npx playwright`, so a regeneration does clobber it; `apps/e2e/README.md` lists the fix.

### 4. `init-skills --loop claude`

`installSkills(allSkills, 'claude')` copies `playwright-cli`, `playwright-component-testing`,
`playwright-trace` from the package into `./.claude/skills/<name>` with
`fs.promises.cp(..., { recursive: true })` — no existence check, overwrites matching files,
deletes nothing, touches no settings. The 21 existing skill directories have none of those names,
so no conflict; Claude Code loads every `.claude/skills/*/SKILL.md` in the project and only
same-name skills shadow each other. `playwright-component-testing` is irrelevant here and can be
deleted after the run (it will come back on the next `init-skills`). #42135 (1.62, closed) shows
the skill content lagging the CLI it describes — regenerate on upgrade.

### 5. Maturity signals

- Introduced 1.56 (Oct 2025) with `--loop=vscode|claude|opencode`; 1.57–1.64 release notes add no
  agent section. `codex` and `copilot` loops, `init-skills` and the bundled `npx playwright mcp`
  (1.62) arrived without release-note entries for the agents themselves; `run-test-mcp-server` is
  hidden in the CLI and has no docs page (`/docs/test-mcp` 404).
- `gh search issues --repo microsoft/playwright "init-agents"`: ~25 hits, all but three closed.
  The cluster is from Oct–Nov 2025: #37749 (41 comments, seed `test.describe()` error, VS Code
  version), #38176 (25, browser tools not found), #37744 (9, tools not detected), #38005/#37869
  (Windows/ENOENT), #38068 (generator cannot edit files), #37789 (stale tool name in healer
  prompt). 2026: #38806/#39147 (malformed YAML in generated agent files, both closed), #42743
  (invalid TS in generator example, closed Sep 2026). Open: #41563 (Cursor loop request),
  #42084/#42139 (component testing, unrelated).
- `run-test-mcp-server`: #39235/#39236 (parallel healers hang; closed "not a supported
  scenario"), #38937 (`test_run` ignores abort, closed), #42384 (artifacts written to workspace
  root, closed), #38332 (custom page fixture, closed with the "decorate, don't replace" advice).
- No issue mentions the `claude` loop specifically failing; the Claude-side reports are about VS
  Code/Copilot. Read: a feature that churned hard for its first two months and has been quiet since
  Feb 2026, with the remaining known limits being fixture-related and single-healer-at-a-time.

### 6. Running the loop in Claude Code

- Subagents in `.claude/agents/` are invoked by automatic delegation (description match), plain
  language ("Use the playwright-test-planner subagent to…"), or `@agent-playwright-test-planner`.
  The docs page's only example request is "Generate a plan for guest checkout."
- The `playwright-test` server comes from project `.mcp.json`; "Claude Code prompts for approval
  in interactive sessions before using project-scoped servers from `.mcp.json` files". Each
  developer approves once (`claude mcp reset-project-choices` to redo). A committed
  `enabledMcpjsonServers`/`enableAllProjectMcpServers` in `.claude/settings.json` only applies once
  the folder is trusted.
- `claude -p`: "In `claude -p` runs, Agent SDK sessions, and cloud sessions, Claude Code can't show
  that prompt: it loads project-scoped servers without asking", unless `disabledMcpjsonServers`,
  `--setting-sources` or `--strict-mcp-config` exclude it. Note the repo's `batch-tickets` skill
  spawns an in-session `general-purpose` subagent via the Agent tool, not `claude -p`; either way
  the server loads, so every batch run will start `npx playwright run-test-mcp-server` — which
  starts the repo's `webServer` (server + `vite preview` + Docker DB) the first time a tool is
  called. Harmless if unused, but it is a reason to keep the healer out of unattended batches.
- The server runs the project's `playwright.config.ts`, so `webServer`, `baseURL` and the auth
  `storageState` are inherited; the planner needs the seed project's fixtures to log in.

### 7. Fit with this repo's Claude Code conventions

- `model: sonnet` is a valid alias (`sonnet`, `opus`, `haiku`, `fable`, full ID, `inherit`). It
  pins the three agents to Sonnet regardless of the session model; editing it to `inherit` is
  allowed but is lost on regeneration. `color` is an accepted field.

  > **Status (2026-10):** The healer alone was edited to `model: inherit`; re-applying it after
  > regeneration is step 1 of "Regenerating them" in `apps/e2e/README.md`.

- `tools` as a comma-separated string is one of the two documented forms; the
  `mcp__playwright-test__<tool>` names are the documented per-tool pattern. `LS` and `MultiEdit`
  are listed by the generator; the sub-agents page does not list them among current tools —
  unknown names are ignored rather than fatal, so the files still load, but it is a sign the
  template targets an older Claude Code.
- Regeneration: the docs say to regenerate "whenever Playwright is updated", and the agent prompts
  reference MCP tool names that change between versions (#37789). So yes: each `@playwright/test`
  bump re-runs `init-agents` and `init-skills`, then re-applies the `.mcp.json` merge and the seed
  edit (the seed is skipped if present, so only `.mcp.json` needs hand care). Nothing in the
  generated files conflicts with `.claude/settings.local.json`; `Bash` is not granted to any
  agent, so the permission allow-list is untouched.

  > **Status (2026-10):** The allow-list did change: `.claude/settings.json` pre-allows
  > `mcp__playwright-test` and `mcp__playwright-test__browser_run_code_unsafe` and sets
  > `enableAllProjectMcpServers: true`, so the healer is not stopped by a permission prompt mid-run.

## Verification trail (2026-10-12)

- `https://playwright.dev/docs/test-agents` — "out of the box" framing; `init-agents` setup and
  regenerate wording; planner inputs; seed example importing `./fixtures`; Claude Code tab holds
  only the command; no "experimental"/"preview" wording; layout tree shows `.github/`.
- `https://playwright.dev/docs/release-notes` (1.56–1.64) and
  `https://github.com/microsoft/playwright/releases/tag/v1.56.0` — Agents section, "It will become
  stable shortly, we are a bit ahead of times"; no later agent entries; 1.62 bundles `npx playwright mcp`/`cli`.
- `https://raw.githubusercontent.com/microsoft/playwright/v1.64.0/packages/playwright/src/program.ts`
  — `init-agents` (`loadConfigFromFile`, `--loop` choices, `-c`, `--project`, `--prompts`);
  `init-skills` (`claude|agents`, default `claude`); hidden `run-test-mcp-server`.
- `.../v1.64.0/packages/playwright/src/agents/generateAgents.ts` — `ClaudeGenerator`, unconditional
  `.claude/agents` and `.mcp.json` writes, tool map, `initRepo` (`specs/` only if absent, seed only
  if `findSeedFile` is empty), no skills/settings access.
- `.../v1.64.0/packages/playwright/src/agents/playwright-test-{planner,generator,healer}.agent.md`
  — frontmatter quoted above.
- `.../v1.64.0/packages/playwright/src/mcp/test/seed.ts` — `seedFileContent`, `defaultSeedFile`,
  `findSeedFile`, `seedProject`.
- `.../v1.64.0/packages/playwright-core/src/tools/utils/installSkills.ts` — skill list, `fs.cp`
  recursive into `.claude/skills/<name>`.
- `https://code.claude.com/docs/en/sub-agents` — `model` values, `tools` string/list, `mcp__<server>`
  patterns, invocation forms, `--agents` file in `-p`.
- `https://code.claude.com/docs/en/mcp` — approval prompt quote, `claude -p` loads without asking,
  `disabledMcpjsonServers`, `--strict-mcp-config`, workspace-trust rule for `enabledMcpjsonServers`.
- `https://code.claude.com/docs/en/skills` — project `.claude/skills/<name>/SKILL.md` discovery,
  same-name precedence.
- `gh search issues --repo microsoft/playwright` for `init-agents`, `run-test-mcp-server`,
  `agents claude`; `gh issue view` 37749, 38176, 38109, 39235, 39236, 38332, 37744.
- Repo: `.claude/` listing, `.claude/settings.local.json`, `.claude/skills/batch-tickets/SKILL.md`
  (spawns a `general-purpose` subagent; no `claude -p`).

Not verified: `configLoader.loadConfigFromFile` behaviour with no config file (not read);
whether Claude Code warns on the unknown `LS`/`MultiEdit` tool names (inferred from the docs'
"unknown field ignored" rule for skills, not stated for subagent tools); no command was executed.
