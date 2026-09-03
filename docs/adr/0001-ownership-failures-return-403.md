# Ownership failures return 403, not 401

An authenticated caller reaching for a cart item or order that belongs to someone else now gets
`ErrorCode.FORBIDDEN` (403) instead of `ErrorCode.UNAUTHORIZED` (401). This keeps 401 meaning
strictly "you are not authenticated", so the client's Axios interceptor and any future
refresh-token logic can key off it unambiguously, and it matches what `authorize()` already
returns for a role mismatch.

## Considered options

Returning 404 (indistinguishable from a missing resource) was rejected: this is a first-party
storefront, ids are unguessable ObjectIds, and there is no enumeration surface, so the existence
of another user's cart item or order is not a meaningful information leak. A distinct 403 is more
honest and easier to debug.

## Consequences

This is an API contract change. `apps/server/test/cart.route.test.ts` and
`apps/server/test/order.route.test.ts` assert the new status; nothing in `apps/client` branched on
a 401 from these routes, so no client change was needed.
