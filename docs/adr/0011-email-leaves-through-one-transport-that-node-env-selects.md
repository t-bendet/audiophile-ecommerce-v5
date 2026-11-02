# Email leaves through one transport that NODE_ENV alone selects

Every email the server sends is rendered first, as raw HTML plus a plain-text part from small
template functions in `apps/server/src/emails`, then handed to the one transport
`apps/server/src/utils/email.ts` selects from `NODE_ENV` and nothing else: an in-memory outbox under
`test`, Resend over its HTTPS send endpoint with a plain `fetch` when `EMAIL_API_KEY` is set, and
the pino logger otherwise. The outbox is read directly by route tests and over HTTP by the E2E suite
through `GET /api/v1/test/outbox?to=<email>`, which answers that recipient's messages and leaves
them in place; `DELETE /api/v1/test/outbox` empties it. The router holding both is mounted only
under `test`. The provider choice, sending domain and secret names are in the
[email provider note](../research/email-provider.md); this records the shape every later email
inherits, settled in [#350](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/350) and
first built in [#353](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/353).

## Considered options

A second variable (`EMAIL_TRANSPORT=outbox`, say) was rejected: the rate limiters already stand down
on `NODE_ENV=test` and one switch is the roadmap's standing constraint, so a suite cannot be started
with the limiters off and real mail on.

Reading sent mail from the database in the E2E suite was rejected. `apps/e2e` drives the system over
HTTP and imports no application package, and the password-reset token is stored only as a hash
([ADR 0012](0012-a-password-reset-link-works-once-and-is-stored-only-as-its-hash.md)), so the
database could not yield it. The test-only route costs one router that is absent, a JSON 404,
everywhere else.

An outbox route that returns and clears in one call was rejected. The E2E suite runs its specs in
parallel against one server, so a spec that drained the outbox could take another spec's mail. Each
spec reads by its own recipient through the `outbox(to)` fixture, and nothing clears on read.

The vendor's `resend` package was rejected in #353 by the owner. As this record words the reason:
the transport is one POST with three headers, which `fetch` makes in a dozen lines, and the
transport test passes in a fake `fetch` instead of mocking a module.

React Email and Resend's hosted templates were rejected: a render dependency and JSX in the server
build, or copy held outside the repo and out of the outbox assertions, for two emails at this
volume.

## Consequences

Development needs no key: a fresh clone with `EMAIL_FROM` set sees each rendered message in the
terminal, and setting `EMAIL_API_KEY` there sends for real. Production requires the key through the
env schema. A new email is a template function plus a method on
`apps/server/src/services/email.service.ts` that sends it with an `Idempotency-Key` named after its
business event, so a retried request cannot send it twice. The order confirmation uses
`order-confirmation/<orderId>`; the password reset uses `password-reset/<userId>/<expiry epoch ms>`,
so a new request is a new send and nothing derived from the token reaches the provider. A send is
never on a request's critical path: the method logs the failure through the request logger and the
caller answers as if it had succeeded, so a provider outage costs a missing email, not a lost order.
The caller awaits it, so the outbox holds the message when the response lands.

Every link an email carries is built on `CLIENT_URL`, the storefront origin from the env schema,
never on the request's `Host`. The Vite development proxy rewrites `Host` to the API's origin, and a
link built from a header the caller controls is a reset-link poisoning vector.

A server variable reaches seven places: `apps/server/wrangler.jsonc` (`vars`, or
`wrangler secret put` for a secret), the `Env` interface and the forwarding block in
`apps/server/worker/index.ts`, `apps/server/src/utils/env.ts`, `apps/server/.env.example`,
`apps/server/.dev.vars.example`, the `env` block in `apps/server/vitest.config.ts` and the
Playwright `webServer` env in `apps/e2e/playwright.config.ts`. `EMAIL_FROM` and `CLIENT_URL` were
wired that way. A developer's existing `apps/server/.env` is not regenerated, so a new required
variable has to be added to it by hand.
