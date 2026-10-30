# Triage labels

Labels in this repository fall into three families. A triaged issue carries one type label and one state label; a wayfinder issue carries only its `wayfinder:*` label. Skills refer to the roles in the state table's first column.

## Type labels

`bug`, `enhancement`, `documentation` classify what the issue is. The remaining GitHub defaults (`duplicate`, `good first issue`, `help wanted`, `invalid`, `question`) exist and are rarely used.

## State labels

| Role              | Label             | Meaning                                  |
| ----------------- | ----------------- | ---------------------------------------- |
| Needs triage      | `needs-triage`    | Maintainer needs to evaluate this issue  |
| Needs information | `needs-info`      | Waiting on reporter for more information |
| Agent-ready       | `ready-for-agent` | Fully specified, ready for an AFK agent  |
| Human-ready       | `ready-for-human` | Requires human implementation            |
| Will not fix      | `wontfix`         | This will not be worked on               |

## Workflow labels

`wayfinder:map` marks the single parent issue holding notes, decisions and fog; `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, and `wayfinder:task` mark its child tickets by type. These are decisions, not implementation work, so they never combine with a state label. The [wayfinder skill](../../.agents/skills/wayfinder/SKILL.md) owns their use.

Read the [issue workflow](issue-tracker.md) for tracker operations. PRs are not a feature-request triage surface in this repo.
