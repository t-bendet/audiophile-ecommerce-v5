# Specs

This is a directory for test plans. The Playwright planner writes them here and the generator
reads one back to write a spec; the [E2E guide](../apps/e2e/README.md#agents) has the workflow.

Every `*.md` in here except this one is git-ignored. A plan is scaffolding for the spec it describes, and once that spec is
in `apps/e2e/tests/` it is the thing to review and keep — a committed plan beside it would be a
second description of the same tests, free to drift. Only this file is tracked.
