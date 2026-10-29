# Historical client middleware proposal

Status: unimplemented design notes, condensed from the former `ERROR_FLOW.md` proposal
dated September 6, 2026. These notes are not implementation instructions or an approved
migration plan. Current behavior is documented in the [client guide](../README.md).

The proposal explored moving navigation timing, error context, and future telemetry into
Router middleware. It also considered shared route context and more explicit separation
between required loader data and optional prefetching. Navigation timing exists today in
[`performanceMiddleware`](../src/app/middleware/performance.ts); a generalized error or
telemetry middleware does not.

Useful questions to revisit if this work is requested:

- Which context is unavailable at existing loader and component error boundaries?
- Would middleware reduce duplicated reporting without duplicating query retries or
  component notifications?
- Which data must block navigation, and which can fail within an optional feature?
- How would authentication redirects preserve the existing cache invalidation and
  return-location behavior?

Before implementing any proposal, verify the installed Router's middleware/error
semantics and test the intended boundary behavior. The former copied middleware and
retry examples were speculative; use current source and a new design decision rather
than treating them as a contract. TanStack Query currently owns request retries.
