# A password reset link works once and is stored only as its hash

`POST /auth/forgot-password` answers the same empty 200 for a known, unknown or deactivated email,
and only an active user is mailed. That user is issued 32 random bytes as hex, emailed raw in
`<CLIENT_URL>/auth/reset-password?token=…` and stored only as its SHA-256 hash in
`passwordResetToken`, with `passwordResetExpires` set to now plus `PASSWORD_RESET_EXPIRY_MS` (one
hour, from `@repo/domain`, which prints it as `PASSWORD_RESET_EXPIRY_LABEL`). A new request
replaces the old token. `POST /auth/reset-password` takes the token in the body beside the new
password, under the signup password rules. It finds the user by the hash with the expiry still
ahead and writes the password in one `prisma.user.update` whose `where` names the hash too, so a
second use, a concurrent one included, finds no record: Prisma's `P2025` answers like any other
spent token. The password write stamps `passwordChangedAt`, which ends every session signed in
before it, and the reset then signs its own cookie, so the session it starts is the live one. An
unknown, expired, replaced, used or empty token answers `PASSWORD_RESET_TOKEN_INVALID` (400) with
one detail at `["body", "token"]`; a deactivated account answers `ACCOUNT_DEACTIVATED`. The forgot
route is behind `passwordResetLimiter` (three requests per hour per IP); the reset route has no
limiter of its own. Settled in
[#350](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/350) and built in [#354](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/354) and
[#355](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/355); the server guide's Email
section has the implementation.

## Considered options

Reusing `INVALID_TOKEN` or `TOKEN_EXPIRED` was rejected: the client reads both as a dead session
and sends the shopper to login, when the reset page has its own expired-link state to show.

A separate code and page state per cause (unknown, expired, used) was rejected. The shopper's next
step is the same, a new link, and a distinct answer would tell a caller which tokens once existed.

The token in the API path or query was rejected.
[ADR 0006](0006-server-validation-errors-belong-to-the-form.md) maps field errors only under `body`, and a URL token lands in every request log line. The emailed
link keeps `?token=` because a link is a GET; the page reads it and posts it as a form value with
no input, and the token validator has no length rule, so a mangled or missing link still reaches
the server and gets the dedicated code.

Sharing `passwordResetLimiter` with the reset route was rejected: it is one in-memory store keyed by
IP, so three forgot requests would lock the reset out. The token carries 256 bits, and the global
`apiLimiter` still applies.

Checking the token before rendering the reset page was rejected, as the
[auth layout design note](../research/auth-layout-design.md) records: the page shows the form and
the save's answer decides whether the expired-link state replaces it.

Leaving earlier sessions alive after a reset was rejected: a reset is how a shopper recovers an
account someone else may be signed in to.

## Consequences

The database can never yield a working link, so the E2E suite reads the link from the test-only
outbox route of [ADR 0011](0011-email-leaves-through-one-transport-that-node-env-selects.md), and
route tests read the outbox directly and compare the token's hash with the stored one.

The write must stay `update`, not `updateMany`: the database client hashes the password and stamps
`passwordChangedAt` only in its `update` hook.

`passwordChangedAt` records the write time. New session tokens carry that exact value and are
valid only while it matches the stored value; older tokens without it use their `iat` as a
fallback. This ends sessions issued immediately before a password write while keeping its newly
issued session valid.

Every later password write inherits the session-ending rule through the same hook.
`PATCH /auth/updateMyPassword` issues a new session after the write, keeping this device signed in
while ending the user's other sessions. Every emailed link needs `CLIENT_URL`, which the env schema requires.
