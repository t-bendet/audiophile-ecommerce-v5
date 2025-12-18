# Phase 1: Preparation Checklist

**Branch:** `feature/error-flow-middleware`  
**Status:** In progress  
**Last Updated:** December 18, 2025

---

## Overview

Phase 1 is a planning and review phase with **no code changes**. Complete this phase before moving to Phase 2 (Add Middleware Infrastructure).

**Estimated time:** 30-60 minutes

---

## Checklist

### 1. Review Error Context API

**Goal:** Understand what error context needs to provide to middleware and components.

- [ ] Read [PART 5: Error Context](apps/client/docs/ERROR_FLOW.md#target-state-v2-with-middleware) section
- [ ] Review existing error classification in [apps/client/src/lib/errors.ts](apps/client/src/lib/errors.ts)
- [ ] Document required context properties:
  - What error data should context hold?
  - What methods should context provide?
  - How will components access context?
- [ ] Decide: Type-safe context using React Context API or simple object?
- [ ] Review React Router v7 `context.get()` and `context.set()` patterns in ERROR_FLOW.md

**Questions to answer:**

1. What properties does the error context need? (e.g., current error, error history, retry count)
2. Should context be created per-request or globally?
3. How will child routes access parent context?

---

### 2. Design Error Middleware Strategy

**Goal:** Plan what middleware will do and how it integrates with current error handling.

- [ ] Review [Middleware Retry Strategies](apps/client/docs/ERROR_FLOW.md#middleware-retry-strategies) section (3 approaches)
- [ ] Decide which retry approach to use:
  - [ ] Approach 1: Retry route once and invalidate queries
  - [ ] Approach 2: Error-type driven strategy
  - [ ] Approach 3: Circuit breaker
  - [ ] Hybrid: Multiple approaches for different scenarios
- [ ] Document middleware responsibilities:
  - Error classification verification
  - Error context assignment
  - Logging and monitoring
  - Conditional retry or transformation
- [ ] List middleware entry points (which routes/loaders need middleware?)
- [ ] Review [Implementation Pattern (5 Steps)](apps/client/docs/ERROR_FLOW.md#implementation-pattern-5-steps) in ERROR_FLOW.md

**Decisions to document:**

1. **Retry Strategy:** Which approach best fits current architecture?
   - Write rationale for choice
   - List scenarios where it applies
   - Identify edge cases

2. **Error Processing:** What should middleware do with errors?
   - Log errors (where? how detailed?)
   - Transform error messages?
   - Add error context/metadata?
   - Track error metrics?

3. **Integration Points:** Where should middleware run?
   - Root level (catch-all)?
   - Specific routes (auth, products, etc.)?
   - Both?

---

### 3. Plan Middleware Integration Points

**Goal:** Map out where middleware will be applied in the current route structure.

- [ ] Explore [apps/client/src](apps/client/src) directory structure
- [ ] Identify React Router v7 route configuration file(s)
- [ ] Review current route setup:
  - [ ] How are routes structured? (layout routes, nested routes, etc.)
  - [ ] Where would root middleware attach?
  - [ ] Which routes are critical vs optional?
- [ ] Create integration map:
  ```
  Root
  ├─ Middleware: errorMiddleware, loggingMiddleware?
  ├─ /products
  │  └─ Loader: prefetchProducts
  ├─ /products/:id
  │  └─ Loader: prefetchProductDetail
  └─ /auth
     └─ Loader: checkAuth
  ```
- [ ] List critical data that should block navigation (Phase 4 concern, but identify now)
- [ ] List optional data that should allow graceful degradation

**Questions to answer:**

1. **Root vs Feature Middleware:** Should middleware be global or per-route?
   - Answer: Both (root catches all, features can override)
   - Plan which errors need root handling vs feature-specific handling

2. **Prefetch Strategy:** Which loaders should use blocking vs non-blocking prefetch?
   - Blocking (critical):
   - Non-blocking (optional):

3. **Error Context Availability:** When does context become available?
   - Should it be initialized at app root?
   - Should middleware initialize it?

---

## Reference Documents

- **ERROR_FLOW.md** - Full specification
  - [Target Architecture Diagram](apps/client/docs/ERROR_FLOW.md#target-architecture)
  - [Middleware Retry Strategies](apps/client/docs/ERROR_FLOW.md#middleware-retry-strategies)
  - [Implementation Pattern](apps/client/docs/ERROR_FLOW.md#implementation-pattern-5-steps)
  - [Loader Prefetch Error Handling](apps/client/docs/ERROR_FLOW.md#loader-prefetch-error-handling)

- **Current Implementation:**
  - [apps/client/src/lib/errors.ts](apps/client/src/lib/errors.ts) - Error classification
  - [apps/client/src/lib/api-client.ts](apps/client/src/lib/api-client.ts) - Axios interceptor
  - [apps/client/src/lib/react-query.ts](apps/client/src/lib/react-query.ts) - Query config

---

## Deliverables from Phase 1

When Phase 1 is complete, you should have documented:

1. **Error Context Design**
   - Context type definition (TypeScript interface)
   - Required properties and methods
   - Access patterns

2. **Middleware Strategy Document**
   - Chosen retry approach with rationale
   - Error processing pipeline (log → classify → transform → decide)
   - List of middleware functions to implement

3. **Integration Map**
   - Route structure with middleware attachment points
   - Critical vs optional data classification
   - Prefetch strategy (blocking/non-blocking per loader)

---

## Next Steps

After completing Phase 1 checklist:

- [ ] Review findings with team (optional)
- [ ] Document decisions in comment at top of this file
- [ ] Create Phase 2 branch or PR if desired
- [ ] Move to **Phase 2: Add Middleware Infrastructure**

---

## Phase 1 Notes

_Document your decisions and findings here as you work through the checklist._

### Error Context Design

- Scope: Global provider at app root; reset/re-seed on navigation start (to avoid stale state).
- Properties: current error (only; no history for now).
- Methods: log/processError (no other methods yet).
- Access: Components use React context; middleware can set/get via router context if needed.

### Middleware Strategy

- Retry approach: React Query-only retries; middleware logs/context only (no retries for now).
- Logging/telemetry: Console only (dev); no external service yet.
- Transformations/normalization: None for now.

### Integration Map

- Route definitions: TODO (locate route config file in apps/client/src to attach root middleware).
- Critical vs optional routes/loaders: Decide later as features evolve.
- Auth/permissions: None for now; add when sign-in exists.
- Found route config: apps/client/src/app/router.tsx (RootLayout → ContentLayout → home/product/category routes with lazy loaders).

---

**Checkpoint:** Phase 1 complete when all checklist items are checked and notes are documented.
