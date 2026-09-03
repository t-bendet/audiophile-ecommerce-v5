---
name: batch-tickets
description: Work a queue of GitHub tickets end to end, one at a time — branch, delegate to a subagent, verify, commit, PR, merge, delete branches — then hand back a report. Use when the user wants a batch of issues shipped unattended, e.g. "/batch-tickets ready-for-agent" or "work tickets 105-130".
---

# Batch tickets

Ship a queue of GitHub issues unattended. **Strictly sequential**: one ticket fully lands on `main`
before the next one branches, so no two agents ever touch the working tree at once and merge
conflicts are impossible.

## Before you start

1. **Confirm the queue.** Resolve `$ARGUMENTS` into a concrete list and print it for the user:
   - a label (`ready-for-agent`) → `gh issue list --state open --label <label> --json number,title`
   - a range (`105-130`) → `gh issue list --state open --json number,title` filtered to that range.
     A range regularly contains closed or non-existent numbers; only work open ones and say which you dropped.
   - bare numbers → use them as given.
     Order the list ascending unless the user gave an order. Do not ask for approval of the list —
     print it and proceed.
2. **Check the tree is clean and `main` is current**: `git switch main && git pull`. Abort the whole
   batch if the tree is dirty; that is the user's uncommitted work.
3. **Announce the gate**: `.github/workflows/ci.yml` runs the same checks on every PR, and the
   local run below is the pre-merge gate that mirrors it.

## Per-ticket loop

For each issue number `N`, in order:

### 1. Read

`gh issue view N --comments`. Extract the ask, the acceptance criteria, and any decisions made in
comments. Pick the conventional-commit `<type>` matching the bulk of the change.

### 2. Branch

```bash
git switch main && git pull
git switch -c <type>/N-<slug>
```

`<slug>` is 2–5 kebab-case words from the title. Convention lives in `docs/agents/issue-tracker.md`.

### 3. Delegate

Spawn **one** subagent (`general-purpose`, `run_in_background: false` — the batch is sequential and
nothing else can proceed until it returns). Give it:

- the full issue body and relevant comments, pasted in — it cannot see this conversation
- the branch it is already on, and that it must **not** commit, push, merge, or switch branches
- the repo conventions it must follow (point it at `CLAUDE.md`)
- an instruction to report what it changed and anything it deliberately left out

### 4. Verify

```bash
pnpm build && pnpm lint && pnpm test && pnpm type-check && pnpm format:check
```

All five must pass. `pnpm type-check` runs `tsc` in every workspace; `pnpm build` also
type-checks the packages it compiles. `pnpm format:check` verifies formatting without rewriting —
use it rather than `pnpm format`, which is the fixer and would hide a formatting miss by silently
correcting it.

**On failure**: make one focused attempt to fix it yourself. If it still fails, this ticket is a
**miss** — go to _Handling a miss_ below and move on to the next ticket. Never merge red.

### 5. Land

```bash
git add <the paths the subagent reported>   # never `git add -A` — unrelated untracked files exist
git commit   # conventional-commit subject; body ends with "Closes #N"
git push -u origin <branch>
gh pr create --base main --title "<type>: <subject>" --body "...Closes #N"
gh pr merge <pr> --squash --delete-branch
git switch main && git pull && git branch -d <branch>
git fetch --prune   # gh deletes the remote branch; this clears the stale tracking ref
```

Commit messages end with the `Co-Authored-By` trailer from the session's attribution rules; PR bodies
end with the generated-with line.

### 6. Record

Append one row to the running report: ticket, title, outcome, PR link, one-line summary of the change.

## Handling a miss

Do not stop the batch. For the failed ticket:

- leave the branch pushed and the PR open (create it if you had not yet), titled with a `[WIP]` prefix
- `gh issue comment N` with what failed and the verification output
- `git switch main && git pull` so the next ticket starts clean
- record it as **failed** with the reason, and continue

The only reasons to abort the whole batch: the working tree was dirty at the start, `main` will not
pull cleanly, or three tickets in a row fail verification (something systemic is broken).

## Final report

Print a markdown table — ticket, title, outcome (shipped / failed / skipped), PR link, note — followed
by:

- what landed on `main`, as a short list of squashed commits
- every failed ticket with its open PR link and what a human needs to do
- any ticket whose scope you narrowed, and what you left out

Then offer to publish the report as an Artifact if the batch was more than a handful of tickets.

## Do not

- run tickets in parallel, or in worktrees — this skill is sequential by design
- merge a ticket whose verification did not pass
- widen a ticket's scope because you noticed something adjacent; file a new issue instead
- touch tickets the user did not name
