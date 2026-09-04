# One default page size for every list

`DEFAULT_PAGE` (1) and `DEFAULT_LIMIT` (20) now live in `packages/domain/src/common.ts`, and every
place that answers "how big is a page the caller did not size?" reads them: `parsePagination` in
`apps/server/src/utils/query.ts`, the `.default()`s on `OrderQueryParamsSchema`, and the client's
default order filters. Before this, the domain schema said 10 and the server utility said 20, and
both sat in the same code path — `listUserOrders` runs its already-validated query through
`parsePagination`.

Nothing was broken by the disagreement: Zod fills `limit` before the service sees it, so the
utility's fallback was unreachable from the route. Two answers to one question is still a trap for
the next caller, which is why the numbers were merged rather than left alone.

## Considered options

Unifying on 10 was rejected. Both numbers are observable, so either choice moves behaviour: 10 would
have shrunk the default page of every other list route — categories, products, users, all of which
leave `limit` optional and take the utility's fallback — while 20 moves only `GET /api/v1/orders`.
The smaller blast radius wins, and orders were the outlier rather than the rule.

Deriving one number from the other (a schema reading the utility's constant, or the reverse) was
rejected as the same two numbers with an import between them. There is one constant.

## Consequences

This is an API contract change. `GET /api/v1/orders` with no `limit` now returns up to 20 orders
and reports `meta.limit: 20`, where it returned 10. Callers that name a `limit` are unaffected, and
`apps/client` names one on every list call — its default filters were changed to the shared
constant, so the client asks for what it always asked for, spelled once.

`OrderQueryParamsSchema` keeps its own `.max(100)`; only the default is shared. Schemas built by
`createQueryParamsSchema` still leave `page` and `limit` optional and let `parsePagination` fill
them, which is now the same fill.
