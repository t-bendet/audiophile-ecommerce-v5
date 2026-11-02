# Email leaves through one transport that NODE_ENV alone selects

Every email the server sends is rendered first, as raw HTML plus a plain-text part from small
template functions in `apps/server/src/emails`, then handed to the one transport
`apps/server/src/utils/email.ts` selects from `NODE_ENV` and nothing else: an in-memory outbox under
`test`, Resend over its HTTPS send endpoint when `EMAIL_API_KEY` is set, and the pino logger
otherwise. The outbox is read directly by route tests and over HTTP by the E2E suite through a
route mounted only under `test`. The provider choice, sending domain and secret names are in the
[email provider note](../research/email-provider.md); this records the shape every later email
inherits, settled in [#350](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/350) and
first built in [#353](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/353).

## Considered options

A second variable (`EMAIL_TRANSPORT=outbox`, say) was rejected: the rate limiters already stand down
on `NODE_ENV=test` and one switch is the roadmap's standing constraint, so a suite cannot be started
with the limiters off and real mail on.

Reading sent mail from the database in the E2E suite was rejected. `apps/e2e` drives the system over
HTTP and imports no application package, and the password-reset token the next slice sends is stored
only as a hash, so the database could not yield it. The test-only route costs one router that is
absent, a JSON 404, everywhere else.

React Email and Resend's hosted templates were rejected: a render dependency and JSX in the server
build, or copy held outside the repo and out of the outbox assertions, for two emails at this
volume.

## Consequences

Development needs no key: a fresh clone with `EMAIL_FROM` set sees each rendered message in the
terminal, and setting `EMAIL_API_KEY` there sends for real. Production requires the key through the
env schema. A new email is a template function plus one `transport.send` with an `Idempotency-Key`
named after its business event, so a retried request cannot send it twice; the order confirmation
uses `order-confirmation/<orderId>`. A send is never on a request's critical path: the caller logs
the failure through the request logger and answers as if it had succeeded, so a provider outage
costs a missing email, not a lost order.
