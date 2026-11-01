---
name: roadmap-batch
description: "Interview the user, turn the approved roadmap items into specced GitHub issues, and hand the issue numbers to batch-tickets to ship."
disable-model-invocation: true
---

# Roadmap batch

Take roadmap items from intent to merged PRs in one invocation. The **interview** fixes the batch,
each approved item becomes a specced issue, and [batch-tickets](../batch-tickets/SKILL.md) ships the
queue. The order is fixed: filing depends on the interview, shipping depends on filing.

## Before you start

Read the [issue workflow](../../../docs/agents/issue-tracker.md) for every tracker operation, its
[cloud sessions](../../../docs/agents/issue-tracker.md#cloud-sessions) subsection first when
`CLAUDE_CODE_REMOTE=true`, and [triage labels](../../../docs/agents/triage-labels.md) for the label
pair an issue carries. Candidates come from [the roadmap](../../../docs/ROADMAP.md). The spec
template lives in [to-spec](../to-spec/SKILL.md); the issue template and blocking-edge rules live in
[to-tickets](../to-tickets/SKILL.md). Both are user-invoked, so read their files rather than invoking
them.

## 1. Interview

Ask all five in one message and wait. Each answer is the user's call; ask again for any left blank.

1. **Count**: how many items this batch takes.
2. **Selection criteria**: independence (no shared files), blast radius, client-only, one codebase
   area, or the user's own picks.
3. **Spec depth** per issue: the full to-spec template, or acceptance criteria only (the to-tickets
   issue template).
4. **Approval**: show each drafted issue body for approval before filing, or file directly.
5. **Merge policy** for the batch: auto-merge on green, or stop at PR open.

Done when all five have an explicit answer.

## 2. Propose candidates

Read the roadmap and explore the codebase enough to name the files each candidate would touch.
Then present, as numbered lists:

- **Candidates** matching the criteria, one line each saying why it fits.
- **Routed to wayfinder**: every item under the roadmap's "needs a design or UX pass" or "Blocked on
  the admin dashboard" headings, and any other whose reason names an open design or product
  decision. Tell the user to run `/wayfinder` on those; they stay out of this batch.
- **Shared files**: each pair of candidates that touches the same file, which needs a blocking edge
  or an agreed order.

Iterate until the user approves a list and its order. That approval is the permission to file.

## 3. Spec and file

For each approved item, in the approved order:

1. **Check for duplicates** across open and closed issues (list with `--state all`). A match becomes
   the ticket, reused as is or updated with the user's agreement, and nothing new is filed for it.
2. **Write the spec** at the chosen depth, keeping the template's own rules: domain vocabulary,
   the area's ADRs, no file paths or code snippets.
3. **Show the draft** and wait for a yes when the interview chose approval.
4. **File it** per the issue workflow with one type label (`enhancement` for roadmap features) and
   `ready-for-agent`.

Once every issue has a number, **wire the blocking edges** between the shared-file pairs in a second
pass, blocker first in the approved order. Leave the roadmap bullet in place: each ticket's own PR
removes it, so the roadmap tracks what has landed.

Done when every approved item has an issue number, its label pair, and its edges.

## 4. Hand off

Invoke batch-tickets with the issue numbers in the approved order and the chosen merge policy, then
print the mapping of roadmap item to issue number so the user can follow the batch.

## Do not

- file an issue the user has not approved in step 2, or more issues than the agreed count
- fill in an interview answer the user left open; ask again instead
- remove roadmap bullets at filing time; the ticket's PR does that
- change ROADMAP.md, other skills, or the guides this skill points at
