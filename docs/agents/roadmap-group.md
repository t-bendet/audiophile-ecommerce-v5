# Roadmap group issues

How a [roadmap](../ROADMAP.md) group becomes issues: one **parent**, one sub-issue per vertical
**slice**, and a **closing re-triage** as the last slice. The roadmap names a group's questions; the
parent holds its answers; each slice body carries the rules the shipping skills read. The templates
below are the single copy of those rules: a session brief, a wayfinder destination or a parent
written by hand points here instead of restating them.

Who reads which issue:

- `mattpocock-skills:to-tickets` fetches the parent and writes the slices
  from it, so the parent's **standing block** is what reaches every slice.
- `t-bendet-skills:roadmap-batch` files parent, slices and re-triage
  from these templates.
- `t-bendet-skills:batch-tickets` reads a slice body for two things:
  the quoted roadmap line (its diff must touch `docs/ROADMAP.md`) and the fixed phrase
  `Merge policy: stop at PR open`.
- `mattpocock-skills:implement` reads the same criteria through code review's spec axis.

Tracker operations (sub-issues, blocking edges, labels) are in the
[issue workflow](issue-tracker.md); the label pair is in [triage labels](triage-labels.md).

## Roadmap file

`docs/ROADMAP.md`

## Parent issue

Title: the group's roadmap heading. Labels: `enhancement`. Shape of
[#437](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/437).

```markdown
## What to build

<The group's outcome in one paragraph, from the shopper's or admin's side. Then what the group
depends on and which earlier groups satisfied it.>

Decisions that shape every slice:

- <Each decision the human ticket or the wayfinder map settled, with its link.>
- Every slice's last acceptance criterion quotes the roadmap item line its PR removes and names
  any roadmap fact the change makes false; the PR edits `docs/ROADMAP.md`.
- Every slice ships its own E2E, named in its criteria. A flow only the phone layout shows goes
  under the E2E guide's mobile project.
- The first slice that introduces a new seam (an upload path, a payment webhook) carries
  `Merge policy: stop at PR open`; every other slice auto-merges on green.
- The closing re-triage is the last sub-issue, blocked by every other slice; its PR closes this
  issue and carries `Merge policy: stop at PR open`.

## Slices

- [ ] <Human ticket, first, labelled `ready-for-human`, or "done" with its link>
- [ ] #<n> <slice title> (blocked by #<n>)
- [ ] #<n> Group <N>: closing re-triage of the roadmap (blocked by every slice above; its PR closes
      this issue)

## Done when

Every slice above is closed and the decisions are recorded in this issue. The closing re-triage
removes the group <N> block from the roadmap and closes this issue with its PR.
```

The four standing bullets are copied verbatim into every parent. Group-specific decisions go above
them.

## Slice issue

A sub-issue of the parent (`--parent`), labels `enhancement` and `ready-for-agent`, blocking edges
native. The body is the `mattpocock-skills:to-tickets` issue template; its acceptance criteria end with the standing tail.
Domain vocabulary, no file paths or snippets, as that skill says.

```markdown
**What to build:** <the end-to-end behaviour, from the user's side>

**Blocked by:** <#n, or "nothing">

<Merge policy: stop at PR open — only on the slice that opens a new seam>

- [ ] <criterion>
- [ ] E2E: <what a spec asserts over HTTP and in the browser; mobile project when phone-only>
- [ ] The roadmap's group <N> line "<quoted item line>" is removed<, and "<quoted fact>" is
      corrected to what shipped>.
```

The quoted line is the carrier: a slice whose diff leaves the roadmap untouched fails the
criterion, and the re-triage's first checklist item is the backstop.

## Closing re-triage issue

Title: `Group <N>: closing re-triage of the roadmap`. Labels `enhancement` and `ready-for-agent`.
Blocked by every other sub-issue of the group. Shape of
[#445](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/445).

```markdown
**What to build:** the roadmap edit that closes group <N>. The group block comes out, every
decision the group settled (<list them>) is carried back into the roadmap and the ADRs, every
remaining group is read against what shipped, and the PR says whether the remaining order holds.
The "Closing re-triage" checklist in `docs/ROADMAP.md` is the acceptance criteria, copied below
with #<parent> filled in.

**Blocked by:** every other sub-issue of the group.

Merge policy: stop at PR open; the order of the remaining groups is reviewed by hand.

- [ ] <the roadmap's "Closing re-triage" checklist, one item per line, with #<parent> in place of
      `#<parent>` and the next group's brief named>
```

The checklist lives in the roadmap's [Closing re-triage](../ROADMAP.md#how-the-roadmap-is-worked)
section and is copied, not linked, so the ticket stands alone when its turn comes.

## Filing order

1. Parent first, with the human ticket as its first sub-issue when the group has one.
2. Slices as sub-issues, blockers before the slices they block.
3. The re-triage last, blocked by every slice.
4. Blocking edges in a second pass, once every issue has a number.

Done when every slice body ends with its quoted roadmap line and an E2E criterion, the re-triage and
any new-seam slice carry `Merge policy: stop at PR open`, and the parent lists every sub-issue.
