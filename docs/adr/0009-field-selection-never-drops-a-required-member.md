# Field selection never drops a required member

A list's `?fields=` is a lower bound: the members the caller needs, which the server guarantees and
may exceed. Every `*DTO` schema in `@repo/domain` is `.strict()` with every member required, and
the services turned the list into a Prisma `select`, so `?fields=id,name` returned rows whose other
members were `undefined`: an object the client's envelope parse rejects and, had it got through,
the admin users table would have shown as deactivated. The services now check the list against the
entity's whitelist (`rejectUnknownFields` in `apps/server/src/utils/query.ts`, the guard that
replaced `parseSelect`) and read the full row; the product and category `toDTO` lost the escape
hatch that passed a partial row through as a DTO.

## Considered options

Removing `fields=` was rejected. Nothing in `apps/client` sends it, but keeping the key, its
whitelist and its 422 means a later optional or heavy DTO member can add a real projection without
reopening the request contract.

Partial DTOs, a `Partial<DTO>` or dedicated projected schema when `fields` is present, were
rejected: they loosen the contract every consumer parses against, and the client would have to
handle a missing member on every read for a parameter it never sends.

Unioning the request with a per-entity "required keys" list was rejected: with every member
required, each list would name the whole row.

## Consequences

[ADR 0002](0002-unknown-sort-and-fields-values-are-rejected.md) still holds for unknown members, and
its "the query the client wrote is the query the server runs" is read with this contract: the
server never answers with less than asked, and more is what `fields=` promises rather than a silent
mismatch. No service passes a `select` to Prisma in `persistFindMany`. Config has no query-taking
list route, so it has no field selection at all and its service dropped the dead handling. A
database-backed route test for users, products and categories requests a projection and parses the
response against the entity's `*GetAllResponseSchema`.

A per-row state added to a DTO is required on every response that parses it. A caller can instead
derive that state, or a specific response can extend the DTO with its own required member. The admin role change in
[#344](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/344) was the first design this
decided: the user detail page reads whether its user is the last active admin from the total of an
active-admins users list (`apps/client/src/features/admin/users/roles.ts`), because `UserDTO` is
also what login and signup answer. The self-user response now extends `UserDTO` with the required
`soleActiveAdmin` member for the security page; it does not change the user list DTO.
