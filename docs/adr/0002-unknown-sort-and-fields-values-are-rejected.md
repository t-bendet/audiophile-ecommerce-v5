# Unknown `sort` and `fields` values are rejected, not dropped

A list query naming a field outside its whitelist — `?sort=hax`, `?fields=password` — now returns
`ErrorCode.VALIDATION_ERROR` (422) and names every offending member in `error.details`, instead of
falling back to the default ordering or dropping the field. This extends to the whole list: one
unknown member rejects the request, so `?sort=hax,-createdAt` is a 422 rather than a sort by
`createdAt` alone.

This reverses the deliberate whitelist-and-fall-back behaviour introduced with the shared query
utilities. It is the same "caller asked for something, got a different result, no signal" bug that
made unknown query _keys_ a 422, one level down from keys to values.

## Considered options

Dropping only the unknown members and honouring the rest was rejected: a partially honoured sort is
still a silently different answer, and the caller has no way to tell which half ran. Either the
query the client wrote is the query the server runs, or the client hears about it.

The whitelist is enforced twice. `createQueryParamsSchema(allowedFields)` in
`packages/domain/src/common.ts` binds it to the request schema of every list route that takes one —
categories, products, users — so the rejection happens at the same validation seam as unknown keys,
before auth or any database work. `parseSelect` / `parseOrderBy` in `apps/server/src/utils/query.ts`
throw on the same input, which is unreachable for a client but fires loudly if a schema and its
service ever stop sharing a whitelist. Both layers call the same
`unknownFieldListMembers(key, value, allowedFields)` over the same exported constant per entity
(`CATEGORY_QUERY_FIELDS` and friends), which is why they cannot disagree on which members are
unknown or on the `unknown_value` detail they report. `/config` has no query-taking route, so its
field list stays in the service that reads it.

`EmptyQuerySchema` became `.strict()` in the same pass, so a route declaring no query params rejects
`?foo=1` rather than ignoring it.

## Consequences

This is an API contract change. `?sort=` and `?fields=` with an empty value are now 422s too — an
empty member is not a field name, and the uniform rule is easier to explain than an exception.
`OrderQueryParamsSchema` lost its `sort` key, which the order service never read: an accepted and
ignored parameter is the same bug with no whitelist involved, so it is now an unrecognized key.
Nothing in `apps/client` sends `sort` or `fields`.
