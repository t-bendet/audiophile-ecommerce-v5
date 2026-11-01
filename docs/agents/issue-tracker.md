# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations; in a cloud session, read **Cloud sessions** below first.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Write multi-line bodies to a file and pass `--body-file <path>` so newlines and literal characters survive shell quoting.
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Make an issue a sub-issue of a parent**: `gh issue create --parent <parent> ...`, or `gh issue edit <parent> --add-sub-issue <child>` afterwards (`gh` 2.94+). Older `gh`: `gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>` (database id, as in **Blocking** below). Without sub-issues, put `Part of #<parent>` at the top of the child body.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh issue create --blocked-by <n>,<n> ...` or `gh issue edit <child> --add-blocked-by <blocker>` (`gh` 2.94+). Older `gh`: `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Count open blockers**: `gh api repos/<owner>/<repo>/issues/<n> --jq .issue_dependencies_summary.blocked_by` (open blockers only; 0 means startable). `gh issue view <n> --json blockedBy` also lists closed blockers, so filter it: `--jq '[.blockedBy.nodes[] | select(.state == "OPEN")] | length'`.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: post the explanation with `gh issue comment <number> --body "..."`, then `gh issue close <number>`. On an already-closed issue, `gh issue close --comment` drops the comment and still exits 0.

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

File issues only into the user's own repo. Never file into `mattpocock/skills` (the repo these skills come from) unless the user owns it. When working from a fork, `gh` can default to the upstream parent: check the target with `gh repo view --json nameWithOwner` before the first `gh issue create` of a session.

## Branching

**Every ticket is implemented on its own branch.** Never commit ticket work directly to `main`.

Branch name: `<type>/<issue#>-<slug>`

| Part       | Rule                                                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `<type>`   | `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, or `perf` — the conventional-commit type matching the bulk of the change |
| `<issue#>` | the bare GitHub issue number, no `#`                                                                                         |
| `<slug>`   | 2-5 kebab-case words from the issue title                                                                                    |

```
feat/112-order-history-page
fix/98-id-validator-uncalled
chore/106-prisma-import-file-extension
docs/104-adr-error-codes
```

**Base and target: `main`.** Branch off an up-to-date `main` and open the PR against `main`. The
legacy `dev` branch is retired — do not branch from it, target it, or merge into it.

```bash
git switch main && git pull
git switch -c <type>/<issue#>-<slug>
# ...work, commit...
gh pr create --base main --title "..." --body "...Closes #<issue#>"
```

Commit subjects use the conventional-commit form `<type>: <summary>`, with `<type>` from the branch
table above. Reference the issue in the commit body and the PR body with `Closes #<issue#>` so GitHub
closes it on merge. Closing keywords ignore negation ("does not close #N" still closes #N), so work
that leaves the issue open references it with `Part of #<issue#>` instead. Preserve existing work when
correcting a misplaced commit; inspect the branch and working tree before choosing a recovery operation.

**No ticket?** Process or housekeeping work that came from a direct request rather than an issue drops
the number: `<type>/<slug>` (e.g. `docs/branching-convention`). Anything a ticket exists for keeps it.

## Cloud sessions

A Claude Code cloud session (`CLAUDE_CODE_REMOTE=true`) cannot reach GitHub GraphQL, so `gh issue ...`, `gh pr ...` and `gh pr checks` fail with 403. The same `gh` binary works against the REST API through `gh api`, and the `gh run ...` commands work as they are. Substitute as follows; everything else in this guide is unchanged, including branch names.

- **Read an issue**: `gh api repos/<owner>/<repo>/issues/<n>`; its comments: `gh api repos/<owner>/<repo>/issues/<n>/comments`.
- **List issues**: `gh api "repos/<owner>/<repo>/issues?state=open&labels=<label>"`. The endpoint returns pull requests too; drop them with `--jq '[.[] | select(.pull_request | not)]'`.
- **Create an issue**: `gh api --method POST repos/<owner>/<repo>/issues -f title="..." -F body=@<file> -f "labels[]=<label>"`. Repeat `-f "labels[]=..."` per label. Sub-issues and blocking edges use the `gh api` fallbacks under **Conventions**; the `--parent` and `--blocked-by` flags are GraphQL.
- **Comment, label, close**: `gh api --method POST repos/<owner>/<repo>/issues/<n>/comments -f body="..."`, `gh api --method POST repos/<owner>/<repo>/issues/<n>/labels -f "labels[]=<label>"`, `gh api --method PATCH repos/<owner>/<repo>/issues/<n> -f state=closed`.
- **Open a PR**: push the branch, then `gh api --method POST repos/<owner>/<repo>/pulls -f title="..." -f head=<branch> -f base=main -F body=@<file>`. The body still references the issue with `Closes #<n>` or `Part of #<n>` as in **Branching**. CI runs once the PR exists, not on the session's pushes.
- **Watch CI**: `gh run list --branch <branch> --json databaseId --jq '.[0].databaseId'` finds the run, `gh run watch <run-id> --exit-status` waits for it. Per-check results: `gh api repos/<owner>/<repo>/commits/<sha>/check-runs`.
- **Merge a PR**: `gh api --method PUT repos/<owner>/<repo>/pulls/<n>/merge -f merge_method=squash -f commit_title="..." -f commit_message="..."`, once the required checks pass. Or enable auto-merge and let GitHub merge on green: `gh api --method PUT repos/<owner>/<repo>/pulls/<n>/ccr/auto_merge -f merge_method=squash`. The `/ccr/` routes are the proxy's replacements for GraphQL-only operations; the 403 message lists them (auto-merge, review threads, draft toggling).
- **Delete a branch**: not permitted from a cloud session (`git push --delete` and `DELETE git/refs` are both refused). The repository deletes head branches on merge, so nothing is left to do.

`main` is protected by the `main-protection` ruleset: PRs only, the three CI jobs required, linear history, and the branch must be up to date with `main` before merging. Work tickets one at a time and branch after the previous PR merges, or update the branch before merging.

## Pull requests as a triage surface

**PRs as a request surface: no.** Triage feature requests through issues. Implementation PRs still follow the branching rules above.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve the object type before acting.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets. The `wayfinder:*` labels are workflow labels, never combined with a triage label; [triage labels](triage-labels.md) defines the family.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (see **Make an issue a sub-issue of a parent**). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: see **Blocking** under Conventions.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (see **Count open blockers**, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
