---
name: batch-tickets
description: Work a queue of GitHub tickets end to end, one at a time — branch, delegate to a subagent, verify, commit, PR, merge, delete branches — then hand back a report. Use when the user wants a batch of issues shipped unattended, e.g. "/batch-tickets ready-for-agent" or "work tickets 105-130".
---

# Batch tickets

Ship a queue of GitHub issues unattended. **Strictly sequential**: each ticket lands, is parked as deferred, or
fails before the next one branches. Only one implementer uses the working tree at a time; concurrent
remote changes can still require conflict resolution.

**Keep your own context lean** so a long queue finishes in one session. Your reads are: each issue
when its turn comes, the implementer's report, `git diff --stat`, and the tails of check output. The
task guides are the implementer's to read; you pass their paths. Reach into the issue-tracker and
verification guides by the section names this skill cites.

**Never wait out a clock**, in either role. Watching a run already in progress (a CI run, a deploy)
is fine; a blocker hours away (a package release-age window, a review, an upstream run) makes the
ticket **deferred**, and the queue moves on.

## Before you start

The [issue-tracker guide](../../../docs/agents/issue-tracker.md) holds ticket operations and branching; the [verification guide](../../../docs/agents/verification.md) holds local checks and CI gates. In a cloud session (`CLAUDE_CODE_REMOTE=true`), read its [cloud sessions](../../../docs/agents/issue-tracker.md#cloud-sessions) subsection first: the `gh issue` and `gh pr` commands below fail there.

1. **Confirm the queue and the merge policy.** Resolve `$ARGUMENTS` into a concrete list of numbers and titles, and print it for the user:
   - a label (`ready-for-agent`) → `gh issue list --state open --label <label> --json number,title`
   - a range (`105-130`) → `gh issue list --state open --json number,title` filtered to that range.
     A range regularly contains closed or non-existent numbers; only work open ones and say which you dropped.
   - a parent issue (a number whose issue lists sub-issues) → its open sub-issues, read with
     **List a parent's sub-issues** in the issue-tracker guide; the parent itself is not a ticket.
   - bare numbers → use them as given.
     Order the list ascending unless the user gave an order; a parent's sub-issues are ordered by
     their blocking edges instead, blocker first and ascending among ties, read with **List a
     ticket's blockers** in the issue-tracker guide. Do not ask for approval of the list — print it
     and proceed.
     The **merge policy** is `merge` unless the arguments say `open` (or "stop at PR open"): `merge`
     lands each PR through auto-merge, as in _Land_; `open` leaves every PR open for a human.
     Under `merge`, a ticket whose body says it stops at PR open (a group's closing re-triage, or
     the first slice that introduces a new seam) is the exception: its PR is left open for review,
     and the tickets it blocks are **deferred** until that review lands.
     Under `open` each ticket must be unblocked by every other ticket in the queue (check with
     **Count open blockers** in the issue-tracker guide), because a blocked ticket would branch from
     a `main` that lacks its blocker's change. Abort the batch if one is.
2. **Check the tree is clean and `main` is current**: `git switch main && git pull`. Abort the whole
   batch if the tree is dirty; that is the user's uncommitted work.
3. **Announce the gate**: identify the applicable local checks and required CI jobs from the verification guide. Local checks do not replace the image and E2E CI jobs.

## Per-ticket loop

For each issue number `N`, in order:

### 1. Read

Read the issue body and comments now, not up front, using **Read an issue** in the issue-tracker guide; `gh issue view N --comments` alone may omit the body off a TTY. Extract the ask, acceptance criteria, and decisions. Pick the conventional-commit `<type>` matching the bulk of the change. A ticket blocked by a deferred ticket is deferred too.

### 2. Branch

```bash
git switch main && git pull
git switch -c <type>/N-<slug>
```

`<slug>` is 2–5 kebab-case words from the title. Convention lives in `docs/agents/issue-tracker.md`.

### 3. Delegate

Spawn **one** implementer as a fresh agent rather than a fork, and wait for its report before
advancing the queue. It plans, then edits. The harness's subagent default picks its model, so the
spawn names none. It is the ticket's only writer; it may spawn read-only
Explore agents for lookups. Its brief carries:

- the issue body and relevant comments, pasted in — it cannot see this conversation
- the branch it is already on, and that it must **not** commit, push, merge, or switch branches
- `AGENTS.md` and the applicable task-guide paths, chosen from the `AGENTS.md` routing table, with
  the sections that bear on the ticket named where you can tell
- **plan first, bounded**: plan from the issue and the named guide sections, then edit. Read guides
  by heading or grep rather than whole. Leave the full test suite until after the first edit. Keep the plan to file-level intent: no line-numbered quotes or drafts of files it will not
  edit.
- **lookups only for versions**: web and registry lookups only on a ticket that changes a version,
  only for the versions being changed. Registry first (`pnpm view <pkg>@<version>` for versions,
  publish dates and peer ranges), then that target version's release notes. Fetch each page once;
  no paging through release lists.
- **report, never wait**: run commands in the foreground, and report a blocker with its resume
  condition rather than sleeping or starting a background timer for it
- **the report**: the paths it changed, what it deliberately left out, the checks it ran with their
  result, and either _done_, _blocked_ (with the resume condition), or _unfinishable in one pass_

A subagent notification that carries no report gets resumed at once with a request for
the report. _Unfinishable in one pass_ makes the ticket a **miss**: its issue comment says the
ticket needs slicing, and the batch moves on. _Blocked_ makes it **deferred**.

### 4. Verify

Run the checks selected from the verification guide, reading `git diff --stat` and the tail of each
check's output. Record commands and results.

**On failure**: make one focused attempt to fix it yourself. If it still fails, this ticket is a
**miss** — go to _Handling a miss_ below and move on to the next ticket. Never merge red.

### 5. Land

Read and apply [pr](../pr/SKILL.md) when preparing the PR body. Follow attribution rules only when supplied by the session or repository.

```bash
git add <the paths the implementer reported>   # never `git add -A` — unrelated untracked files exist
git commit   # conventional-commit subject; body ends with "Closes #N"
git push -u origin <branch>
gh pr create --base main --title "<type>: <subject>" --body-file <prepared-body-file>
gh pr merge <pr> --auto --squash --delete-branch   # merge policy `merge` only
gh pr checks <pr> --watch
gh pr view <pr> --json state --jq .state   # repeat until MERGED; auto-merge fires after CI
git switch main && git pull && git branch -D <branch>
git fetch --prune   # GitHub deleted the remote branch; this clears the stale tracking ref
```

Touch local branches only once the state is `MERGED`: deleting the head branch of an open PR closes
it. Then watch `main`'s run in the background (**Watch CI** in the issue-tracker guide, with `--branch main`) and start the next ticket. Before the next PR's
`gh pr merge --auto`, confirm that watch exited green.

Under `open`, skip auto-merge and stop after the checks: record the PR link and its check result,
`git switch main && git pull`, and leave the branch for the reviewer. A red check is a miss under
either policy.

### 6. Record

Append one row to the running report: ticket, title, outcome (**shipped**, **open** under the `open`
policy, **failed**, or **deferred**), PR link, one-line summary of the change.

## Handling a miss

Do not stop the batch. For the failed ticket:

- commit and push the ticket's files to preserve the failed attempt, then leave a draft PR open (create it if needed), titled with a `[WIP]` prefix
- `gh issue comment N` with what failed and the verification output tail
- `git switch main && git pull` so the next ticket starts clean
- record it as **failed** with the reason, and continue

The only reasons to abort the whole batch: the working tree was dirty at the start, `main` will not
pull cleanly, a `main` run goes red, a ticket is blocked by another in the queue under the `open`
policy, or three tickets in a row fail verification (something systemic is broken).

## Handling a deferred ticket

A ticket blocked on a bounded external wait is parked, not waited on:

- if the implementer changed files, commit them to the ticket branch and push it (the retry's
  rebase then pushes with `--force-with-lease`)
- record the ticket as **deferred** with its resume condition (the date a release-age window
  opens, the PR whose review it waits on, the upstream run)
- `git switch main && git pull`, and continue with the next ticket

When the rest of the queue is done, retry each deferred ticket **once**, in queue order. If its
resume condition holds, `git switch <branch> && git rebase main` (or branch fresh when nothing was
committed), delegate again with the earlier report pasted in, and run Verify and Land. If it still
does not hold, it stays **deferred** in the final report.

## Final report

After the deferred retries, under `merge` and once the last `main` run is green, check
`/api/v1/health` once at the deployed hostname in the [deployment runbook](../../../docs/deployment.md). Then print a markdown table — ticket, title, outcome (shipped / open / failed /
deferred), PR link, note — followed by:

- what landed on `main`, as a short list of squashed commits, or under `open` the PRs waiting for review
- the health check result
- every failed ticket with its open PR link and what a human needs to do
- every deferred ticket with its resume condition
- any ticket whose scope you narrowed, and what you left out

Then offer to publish the report as an Artifact if the batch was more than a handful of tickets.

## Do not

- run tickets in parallel, or in worktrees — this skill is sequential by design
- split one ticket across several implementers; a ticket too big for one is re-sliced in the tracker
- merge a ticket whose verification did not pass
- widen a ticket's scope because you noticed something adjacent; file a new issue instead
- touch tickets the user did not name
