# A route the role cannot reach is not found

React Router middleware guards route groups on the client: `requireAuth` sends a guest to login
with a return URL, and `requireRole` answers a signed-in shopper whose role does not match with the
not-found page, the same page an unknown URL shows. The API keeps returning 403 for a role mismatch
([ADR 0001](0001-ownership-failures-return-403.md)); the two layers answer different questions. The
API tells a caller who already holds a resource's id that it is not theirs. The client decides
whether a page exists for this shopper at all, and an admin page does not.

## Considered options

A "forbidden" page was rejected: it tells a shopper that an admin area exists at that URL and gives
a legitimate admin nothing the not-found page does not. The reasoning in ADR 0001 (unguessable
ids, no enumeration surface) does not carry over, because `/admin` is a fixed, guessable path.

A redirect to the home page was rejected: it changes the URL under the shopper, and a mistyped link
an admin shared would land on the home page with no explanation instead of a not-found page at the
URL they typed.

## Consequences

`requireRole` throws a 404 response. React Router bubbles an error thrown before `next()` to the
shallowest route loading in that navigation, so the route boundary and the root boundary both
render the not-found page; the [client guide](../../apps/client/README.md#router-middleware) has
the details. Server routes are unaffected: an admin API call made with a shopper's cookie still
returns 403, which the client treats as a live session that may not do this, not a dead one.
