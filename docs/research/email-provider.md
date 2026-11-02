# Transactional email provider for Audiophile — research note

Written 2026-11-02 as the input for the group 1 parent issue ("Email foundation and account
recovery" in the [roadmap](../ROADMAP.md)). It answers one question: which transactional email
provider should Audiophile use for password reset, order confirmation and, later, order status
notifications? It compares Resend, Postmark, Mailgun and Amazon SES as the brief asked, and adds
Cloudflare's own Email Sending, which entered public beta in April 2026 and is included in the
Workers Paid plan this project already pays for. Every external claim names the primary source it
was read from; repo facts cite file paths. Versions were read from the npm registry on the day of
writing. Nothing in the repo other than this file was modified. Where a fact could not be verified
from a primary source, the text says so.

## Recommendation

**Use Resend, sending from `mail.t-bendet.com`, over its HTTPS API with the vendor's fetch-based
`resend` package or a plain `fetch` call.** At this store's volume it costs nothing (3,000 emails a
month, 100 a day, no card, no account review before the first send), it is the only one of the
five candidates with a documented server-side idempotency key, which is what makes "send the order
confirmation exactly once" cheap to get right, and it is the only one whose docs include a
Cloudflare DNS guide that names the orange-cloud gotcha. Its records live on `send.` and
`resend._domainkey.` names, so the SPF, MX and DMARC records `t-bendet.com` already publishes are
left alone.

What would make us switch: Cloudflare Email Sending leaving beta with a published daily quota, an
idempotency key, and a sending-side test mode. It is already paid for (3,000 emails a month are
included in Workers Paid, so both candidates cost nothing at this volume), it accepts `reply_to`
and has an official Node SDK, its DNS is configured by Cloudflare itself, and its delivery events
arrive through Queues, which the existing Worker could consume. A second trigger is an EU
data-residency requirement: Resend dispatches from Ireland on request but stores every log and
message in the United States; Mailgun's EU region or SES in `eu-west-1` keep message data in the
EU.

## Why not Cloudflare's own email products, and why not SMTP

A reader on this stack will ask first why the Worker does not just send the mail. Two products
exist. [Email Routing](https://developers.cloudflare.com/email-routing/) "processes incoming
emails with Workers or forwards them to destination addresses"; it is inbound. Outbound is
[Email Sending](https://developers.cloudflare.com/email-service/), labelled Beta on the product
page (last updated 2026-10-15) and announced as public beta on
[2026-04-16](https://developers.cloudflare.com/changelog/post/2026-04-16-email-sending-public-beta/):
"Email Sending is available on the Workers paid plan." The
[pricing page](https://developers.cloudflare.com/email-service/platform/pricing/) (last updated
2026-06-09) says "Sending to arbitrary recipients requires the Workers Paid plan" and marks the
Workers Free column "Not available"; the product
[changelog](https://developers.cloudflare.com/changelog/product/email-service/) has no
general-availability entry as of its newest post (2026-09-25), and no Cloudflare blog post announces
one. It is a real candidate and is compared below. It is not the pick today because, per its own
docs, "New accounts start with a conservative daily quota and scale up over time" with no number
published ([limits](https://developers.cloudflare.com/email-service/platform/limits/)), neither the
[REST API page](https://developers.cloudflare.com/email-service/api/send-emails/rest-api/), the
[API reference](https://developers.cloudflare.com/api/resources/email_sending/methods/send/) nor the
official SDK documents an idempotency key, delivery events are published to
[Queues](https://developers.cloudflare.com/email-service/reference/event-subscriptions/) rather
than to an HTTPS endpoint, the simulated local mode applies to the Workers binding and not to the
REST API ([local development](https://developers.cloudflare.com/email-service/observability/local-development/sending/)),
and the product is in beta.

SMTP out of the container is not documented as blocked, but it is not documented as open either.
The Containers [outbound traffic](https://developers.cloudflare.com/containers/platform-details/outbound-traffic/)
page says "By default, a Container will allow internet access", and the only port statement is
about the restricted mode: when `enableInternet` is `false`, "Only ports `80` and `443` are
available." Ports 25, 465 and 587 are not mentioned on that page, the
[FAQ](https://developers.cloudflare.com/containers/faq/) or the
[limits](https://developers.cloudflare.com/containers/platform-details/limits/) page. Every
provider below offers an HTTPS API, so the question never has to be settled.

## Comparison

Prices and limits as published on 2026-11-02. "Approval" means a human or automated gate between
sign-up and the first email to an arbitrary recipient.

| Criterion               | Resend                                                                                                                                                          | Postmark                                                                                                                                                   | Mailgun                                                                                                                                                              | Amazon SES                                                                                                                                                                            | Cloudflare Email Sending (beta)                                                                                                                                                                                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Free tier / low volume  | Free: 3,000/month, 100/day, 3 domains, 30-day retention, 1 webhook endpoint, no card. Pro $20/month for 50,000.                                                 | Free: 100/month, never expires, no overage, 45-day retention. Basic $15/month for 10,000. A few hundred a month overflows Free.                            | Free: 100/day, 1 custom domain, 1-day log retention, 0-day message retention, no card. Basic $15/month for 10,000.                                                   | $0.10 per 1,000 plus $0.12/GB attachments. No SES-specific free tier on the pricing page; new AWS accounts get $100–200 credits on a 6-month free plan.                               | Not available on Workers Free. 3,000/month included in Workers Paid (already paid), then $0.35 per 1,000; hard bounces count, API-rejected sends do not. Sends to verified destination addresses are free and uncounted.                                                                       |
| Approval / onboarding   | None documented. Until a domain is verified, `onboarding@resend.dev` can only reach the account's own address.                                                  | Manual review of every account, "less than 24 hours on weekdays"; until approved, only addresses on your own verified domains.                             | Email and SMS phone verification (no VoIP numbers); automated "business verification" holds possible. Sandbox domain reaches at most 5 authorized recipients.        | Sandbox per region: verified recipients only, 200 per 24 h, 1 per second. Production access is a console form with an "initial response ... within 96 hours".                         | Verified destination addresses only until a domain is onboarded; then "a conservative daily quota" that is not published, raised automatically over time or through a limit-increase form.                                                                                                     |
| SDK / API               | `resend` 6.37.0 (2026-10-30, Resend org), global `fetch`, Node ≥20. `POST https://api.resend.com/emails`, `Authorization: Bearer re_…`.                         | `postmark` 5.1.0 (2026-07-10, ActiveCampaign org), native fetch, zero deps, Node ≥18. `POST https://api.postmarkapp.com/email`, `X-Postmark-Server-Token`. | `mailgun.js` 14.1.1 (2026-11-02, Mailgun org), axios. `POST https://api.mailgun.net/v3/{domain}/messages`, HTTP Basic `api:<key>`, multipart form.                   | `@aws-sdk/client-sesv2` 3.1161.0 (2026-10-30, AWS), node:http by default. `POST https://email.<region>.amazonaws.com/v2/email/outbound-emails`, SigV4 (access key + secret + region). | Workers binding; `POST /accounts/{account_id}/email/sending/send` with `Authorization: Bearer <API token>`, wrapped by `cloudflare` 7.3.0 (2026-10-03, Cloudflare org) as `client.emailSending.send()`; or SMTP on 465, implicit TLS only (beta). REST fields include `cc`, `bcc`, `reply_to`. |
| Idempotency key         | `Idempotency-Key` header, kept 24 h, 409 on reuse with a different payload.                                                                                     | None: "Postmark does not currently support an idempotency key feature."                                                                                    | None documented for `/messages`.                                                                                                                                     | None: `SendEmail` v2 has no client token field.                                                                                                                                       | None: absent from the REST page, the API reference and the SDK's `EmailSendingSendParams`.                                                                                                                                                                                                     |
| DNS records             | TXT DKIM at `resend._domainkey`; MX + SPF TXT at `send.`; optional CNAME `links` for click tracking. Subdomain recommended. Cloudflare guide: DNS only.         | TXT DKIM at `<timestamp>pm._domainkey`; CNAME `pm-bounces` → `pm.mtasv.net`; no SPF needed. Cloudflare guide: turn the orange cloud off.                   | SPF TXT and DKIM TXT (`<selector>._domainkey`) on the sending subdomain; MX optional; CNAME `email.` for tracking, DNS only. `mg.`/`mail.` subdomain recommended.    | Three CNAMEs `<token>._domainkey` → `<token>.dkim.amazonses.com`; custom MAIL FROM subdomain needs MX + SPF TXT. No Cloudflare proxy note.                                            | Cloudflare writes them: MX ×3, SPF TXT and DKIM TXT on `cf-bounce.`, DMARC at `_dmarc`.                                                                                                                                                                                                        |
| Sandbox / test mode     | No test key. `delivered@`, `bounced@`, `complained@`, `suppressed@resend.dev` behave like real outcomes; count toward quota.                                    | Sandbox servers (black hole, count toward volume); `POSTMARK_API_TEST` token (no activity log, no templates); `test@blackhole.postmarkapp.com`.            | `o:testmode=yes` accepts without delivering, "You are charged for messages sent in test mode!"; sandbox domain delivers to ≤5 verified recipients.                   | Mailbox simulator `success@`, `bounce@`, `complaint@…simulator.amazonses.com`: no quota or reputation impact, but billed.                                                             | `wrangler dev` simulates the Workers binding (logs, does not send). Nothing for the REST API. Verified destination addresses are the free test path.                                                                                                                                           |
| Delivery event webhooks | 11 `email.*` events (sent, delivered, delivery_delayed, bounced, complained, opened, clicked, failed, …). Svix / Standard Webhooks HMAC headers. ~24 h retries. | Delivery, Bounce, SpamComplaint, Open, Click, SubscriptionChange. No HMAC: basic auth, custom headers, published IP allowlist. 6 retries.                  | accepted, delivered, temporary_fail, permanent_fail, opened, clicked, unsubscribed, complained. HMAC-SHA256 of `timestamp+token` with the signing key. ~8 h retries. | No HTTPS webhook. Events (Send, Delivery, Bounce, Complaint, Reject, Open, Click, DeliveryDelay, …) go to SNS/EventBridge/Firehose; SNS HTTPS posts are certificate-signed.           | Six `message.*` events (delivered, deferred, bounced, failed, rejected, complained) via Queues, Worker or HTTP pull consumer; no HTTPS webhook.                                                                                                                                                |
| Templates               | `html`, `text`, `react` (Node SDK, needs `@react-email/render`), and hosted Templates with `{ id, variables }`.                                                 | Hosted Mustachio templates with layouts (`/email/withTemplate`), or `HtmlBody`/`TextBody`.                                                                 | Hosted Handlebars templates (`template` + `t:variables`), or `html`/`text`.                                                                                          | Stored or inline Handlebars-style templates; `Simple` `Html`/`Text`; `Raw` MIME. Templates do not HTML-escape.                                                                        | `html` and `text` fields, or `send_raw` for a prebuilt MIME message. No templates resource in the API reference or the docs index.                                                                                                                                                             |
| EU data                 | Per-domain dispatch region incl. `eu-west-1`, but "All account data ... is stored in the United States regardless". DPA in force for every account.             | US only (Chicago data centre), "don't have plans to add servers in the EU". DPA incorporated into the terms.                                               | US or EU chosen per domain; EU base URL `api.eu.mailgun.net`; "message data never leaves the region". Sinch DPA v8 incorporated by reference.                        | Seven EU regional endpoints; "We will not move or replicate your content outside of your chosen AWS Region(s)". AWS DPA incorporated in the Service Terms.                            | Not stated on any Email Service page; the Data Localization Suite compatibility table lists Email Routing but not Email Sending.                                                                                                                                                               |
| Fetch-only runtime note | Official Cloudflare Workers guide; SDK is `fetch`-based.                                                                                                        | 5.0.0 changelog: "restores compatibility with Edge/Workers runtimes". No Workers page on postmarkapp.com.                                                  | Works on Workers with `useFetch: true` per a maintainer comment; no docs page.                                                                                       | AWS maintainers: "AWS does not guarantee support for 3rd party offerings like Cloudflare Workers."                                                                                    | Native.                                                                                                                                                                                                                                                                                        |

Fit for this repo: the Express server runs on Node 22 inside the container, so every SDK above
works; the "fetch-only" row only matters if the mailer ever moves into the Worker.

## Per-provider notes

### Resend

Pricing: the [pricing page](https://resend.com/pricing) lists Free at $0 with 3,000 emails a month,
3 custom domains, 30-day data retention and one webhook endpoint, and Pro at $20 a month for 50,000
with $0.90 per extra 1,000; there is no plan between them. The knowledge base adds "The Free plan
is limited to 100 emails per day"
([what-is-resend-pricing](https://resend.com/docs/knowledge-base/what-is-resend-pricing)). The
terms say "You are not required to provide billing information to use the Free Tier"
([terms](https://resend.com/legal/terms-of-service)). Before a domain is verified the shared
`resend.dev` sender "can only send emails to the email address associated with your Resend account"
([403 error](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain)). No pre-send
account review is documented; the terms reserve post-hoc review only. Whether Resend performs an
undocumented manual review on new accounts could not be verified.

API and SDK: `POST https://api.resend.com/emails` with `Authorization: Bearer re_…`
([send email](https://resend.com/docs/api-reference/emails/send-email)). The `resend` package is
MIT, published by the Resend GitHub org, `engines.node >= 20`, dual ESM/CJS, and its transport is
the global `fetch` against `https://api.resend.com`
([package.json](https://raw.githubusercontent.com/resend/resend-node/main/package.json),
[resend.ts](https://raw.githubusercontent.com/resend/resend-node/main/src/resend.ts)); version
6.37.0 was published 2026-10-30 ([npm](https://registry.npmjs.org/resend/latest)). Its only runtime
dependencies are `postal-mime` and `standardwebhooks`. The `Idempotency-Key` header is 1–256
characters, "kept in the system for 24 hours", recommended as `<event-type>/<entity-id>`, and a
reuse with a different payload returns 409
([idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys)). Rate limit: "10
requests per second per team" ([rate limit](https://resend.com/docs/api-reference/rate-limit)).
API keys can be created with `sending_access` ("Can only send emails") and restricted "to send
emails only from a specific domain"
([create API key](https://resend.com/docs/api-reference/api-keys/create-api-key)); the container
should hold such a key, not a full-access one.

DNS: the create-domain response shows the three records: TXT `resend._domainkey` with `p=…`, MX
`send` → `feedback-smtp.<region>.amazonses.com` priority 10, and TXT `send` with
`v=spf1 include:amazonses.com ~all`; the return-path label "Defaults to `send`"
([create domain](https://resend.com/docs/api-reference/domains/create-domain)). The `amazonses.com`
values and the subprocessor list ("Amazon Web Services, Inc. (USA) — Third party hosting and
sending provider", [subprocessors](https://resend.com/legal/subprocessors)) show SES underneath;
Resend does not say "SES" on the pages read. The [Cloudflare guide](https://resend.com/docs/dashboard/domains/cloudflare)
sets "Proxy Status: `DNS Only (disabled)`" and the verification troubleshooting page says "the cloud
icon next to the record must be gray (**DNS only**), not orange"
([not verifying](https://resend.com/docs/knowledge-base/what-if-my-domain-is-not-verifying)). "We
recommend sending your emails from one or more subdomains (e.g., `updates.example.com`) instead of
your root domain" ([domains](https://resend.com/docs/dashboard/domains/introduction)). DMARC
guidance: start at `p=none` ([DMARC](https://resend.com/docs/dashboard/domains/dmarc)).

Testing: there is no test API key. `delivered@resend.dev`, `bounced@resend.dev` ("SMTP 550 5.1.1"),
`complained@resend.dev` and `suppressed@resend.dev` simulate outcomes, support `+label` suffixes,
and "Test emails count against your account's sending quota"
([send test emails](https://resend.com/docs/dashboard/emails/send-test-emails)).

Webhooks: `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.complained`,
`email.bounced`, `email.opened`, `email.clicked`, `email.failed`, `email.suppressed` and others
([event types](https://resend.com/docs/dashboard/webhooks/event-types)); verification uses the
`svix-id`, `svix-timestamp` and `svix-signature` headers through the `svix` package or
`resend.webhooks.verify`, against the raw body
([verify](https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests)); retries run from
immediately to 10 hours over roughly a day, delivery is at-least-once, and failing endpoints are
disabled ([retries](https://resend.com/docs/webhooks/retries-and-replays)).

Templates: `html`, `text`, and `react` ("Only available in the Node.js SDK"); the SDK renders
`react` itself through an optional `@react-email/render` peer, so it works in Express, not only
Next ([render.ts](https://raw.githubusercontent.com/resend/resend-node/main/src/render.ts)). Hosted
Templates take `template: { id, variables }` and cannot be combined with `html`/`text`/`react`
([templates](https://resend.com/docs/dashboard/templates/introduction)).

EU: regions `us-east-1`, `eu-west-1`, `sa-east-1`, `ap-northeast-1` are chosen per domain and
change only by deleting and re-adding it; "All account data, including email metadata, logs, and
API records, is stored in the United States regardless of the sending region you select"
([regions](https://resend.com/docs/dashboard/domains/regions)); "there is no setting today that
moves stored data to the EU" ([GDPR](https://resend.com/security/gdpr)). "A GDPR Article 28 Data
Processing Addendum is in force for every Resend account" ([DPA](https://resend.com/legal/dpa)).

Gotchas: the 100-a-day cap is the one to watch if a bulk resend is ever scripted. Batch sends do
not support attachments. Click tracking needs the `links` CNAME and is unnecessary for password
reset and order mail; leave it off and the CNAME out.

### Postmark

Pricing: "Test your integration with 100 emails/month", "No overages allowed in this plan", "it
doesn't expire"; Basic is $15 a month for 10,000 with $1.80 per extra 1,000, 45-day retention
([pricing](https://postmarkapp.com/pricing)). "A sent Transactional or Broadcast message, a
Sandboxed test message, and a processed Inbound message all count as 1 email"
([monthly pricing](https://postmarkapp.com/support/article/1107-how-does-monthly-pricing-work)).
The Free column's custom-domain cap could not be read reliably from the pricing table.

Approval: "We manually review each new account"; "Until your account is approved, you won't be able
to send to any email address outside the domains you've added"; "less than 24 hours on weekdays and
a little longer on the weekends" ([approval](https://postmarkapp.com/support/article/1084-how-does-the-account-approval-process-work)).

API and SDK: `POST https://api.postmarkapp.com/email` with `X-Postmark-Server-Token`
([email API](https://postmarkapp.com/developer/api/email-api)). `postmark` 5.1.0 (2026-07-10,
[npm](https://registry.npmjs.org/postmark/latest)) "uses the native Fetch API and has no runtime
dependencies" ([README](https://raw.githubusercontent.com/ActiveCampaign/postmark.js/main/README.md));
5.0.0 "Migrated the HTTP client from axios to the native Fetch API"
([CHANGELOG](https://raw.githubusercontent.com/ActiveCampaign/postmark.js/main/CHANGELOG.md)). "At
this time, Postmark does not currently support an idempotency key feature"
([idempotency](https://postmarkapp.com/support/article/what-is-an-idempotency-key)).

DNS: DKIM "needs to be added to your DNS as a TXT record" with a selector like
`2023060112345pm._domainkey`; Return-Path is a CNAME, default host `pm-bounces`, value
`pm.mtasv.net` ([verify a domain](https://postmarkapp.com/support/article/1046-how-do-i-verify-a-domain),
[DKIM](https://postmarkapp.com/support/article/setting-up-dkim-for-your-domain)). SPF is not
required: "your emails sent through Postmark will always pass SPF by default"
([SPF](https://postmarkapp.com/support/article/1102-why-is-it-not-required-to-include-postmark-in-our-own-custom-spf-record)).
The Cloudflare article says to "click on the orange cloud to disable Cloudflare on the CNAME record"
([Cloudflare](https://postmarkapp.com/support/article/adding-dkim-and-return-path-records-to-cloudflare)).

Testing: sandbox servers deliver "to a black hole" and "do count towards your monthly sending
volume" ([sandbox](https://postmarkapp.com/developer/user-guide/sandbox-mode/server-sandbox-mode));
the `POSTMARK_API_TEST` token sends nothing and shows nothing in Activity, and "does not work with
the API endpoint for sending using a Template"
([testing](https://postmarkapp.com/support/article/1213-best-practices-for-testing-your-emails-through-postmark),
[templates FAQ](https://postmarkapp.com/support/article/1100-templates-faq)).

Webhooks: six event types; "Postmark does not currently support HMAC webhook signature
verification", so authenticity rests on HTTPS, basic auth and the published IP list; six retries
over about 50 minutes ([webhooks overview](https://postmarkapp.com/developer/webhooks/webhooks-overview),
[IPs](https://postmarkapp.com/support/article/800-ips-for-firewalls)).

Templates: Mustachio, `/email/withTemplate` with `TemplateAlias` and `TemplateModel`, layouts, 100
templates per server ([templates API](https://postmarkapp.com/developer/api/templates-api)).

EU: "we also store our data in the US"; "We currently don't have plans to add servers in the EU"
([GDPR FAQ](https://postmarkapp.com/support/article/1218-gdpr-faq),
[EU privacy](https://postmarkapp.com/eu-privacy)); the [DPA](https://postmarkapp.com/dpa) is
effective on incorporation into the terms.

Gotchas for this store: the Free plan is 100 a month, so a few hundred means paying $15 a month from
day one; the account review delays the first real send; no idempotency and no signed webhooks mean
both must be built on our side.

### Mailgun

Pricing: Free "100 emails/day", "1 custom sending domain", "1 day log retention"; Basic $15 a month
for 10,000 with "No daily email limit" and still 1-day logs
([pricing](https://www.mailgun.com/pricing/)). "Mailgun's Free plan requires no credit card"
([free plan](https://help.mailgun.com/hc/en-us/articles/203068914-What-does-the-Free-plan-offer)).
"Accounts on the Free plan are limited to using only the default sandbox domain with Authorized
Recipients as well as one other domain"
([add a domain](https://help.mailgun.com/hc/en-us/articles/203637190-How-can-I-add-or-delete-a-domain)).
The documentation FAQ still says "Free accounts do not include the ability to create a custom
domain" ([FAQ](https://documentation.mailgun.com/docs/mailgun/faq/faqs)), which contradicts the
newer pricing page and help centre; and the Authorized Recipients article says a Free account
"without credit card information present" is "restricted to sending just to Authorized Recipients"
([authorized recipients](https://help.mailgun.com/hc/en-us/articles/217531258-Authorized-Recipients)).
Whether a card-less Free account's custom domain can reach arbitrary recipients is therefore
unverified. Free has "0 days of message retention"
([retention](https://help.mailgun.com/hc/en-us/articles/8841411163035-Adjusting-a-domain-s-message-retention-settings)).

Onboarding: "every account completes a two-step account activation process ... verifying both your
email address and a phone number"; "Voice over IP (VoIP), virtual numbers, and landlines cannot be
used" ([activation](https://help.mailgun.com/hc/en-us/articles/37182933150491-Account-Activation)).
Automated systems may "flag an account for further review or establish a temporary rate limit"
pending business verification
([business verification](https://help.mailgun.com/hc/en-us/articles/202850080-Why-did-I-receive-the-error-Business-verification-is-required)).

API and SDK: `POST https://api.mailgun.net/v3/{domain_name}/messages` as `multipart/form-data`
([messages](https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun/messages/post-v3--domain-name--messages));
"Authentication to the Mailgun API is done by providing an Authorization header using HTTP Basic
Auth" with user `api`; "Domain Sending Keys are API keys that only allow sending messages"
([authentication](https://documentation.mailgun.com/docs/mailgun/api-reference/authentication)).
`mailgun.js` 14.1.1 (2026-11-02, [npm](https://registry.npmjs.org/mailgun.js/latest)) depends on
`axios`, `base-64` and `url-join` and needs a `FormData` constructor passed in
([README](https://raw.githubusercontent.com/mailgun/mailgun.js/master/README.md)). No idempotency
key is documented for `/messages`.

DNS: SPF TXT `v=spf1 include:mailgun.org ~all` and DKIM TXT at `<selector>._domainkey` (selector
assigned per domain, 1024- or 2048-bit) on the sending subdomain; MX `mxa`/`mxb.mailgun.org` for
inbound; tracking CNAME `email.<domain>` → `mailgun.org`
([Cloudflare DNS guide](https://help.mailgun.com/hc/en-us/articles/15585722150299-Cloudflare-DNS-Setup-Guide),
[verification guide](https://help.mailgun.com/hc/en-us/articles/32884700912923-Domain-Verification-Setup-Guide)).
"If you're using Cloudflare Proxy, you will need to turn off Cloudflare's proxy for your CNAME
record. Instead, set it to DNS only"
([HTTPS tracking](https://help.mailgun.com/hc/en-us/articles/360011566033-HTTPS-Tracking-Links)),
and one-click HTTPS tracking links need Foundation or above. "we recommend using a subdomain for
better email deliverability", e.g. `mg.mycompany.com`
([which domain](https://help.mailgun.com/hc/en-us/articles/202256730-What-domain-name-should-I-use-with-Mailgun)).

Testing: `o:testmode=yes` means "Mailgun will accept the message but will not send it" and "You are
charged for messages sent in test mode!"
([test mode](https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/test-mode)).

Webhooks: eight event types; the signature is a "Hex-encoded HMAC-SHA256 of timestamp + token,
keyed with your Webhook Signing Key", an account-wide key distinct from the API key
([securing webhooks](https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/securing-webhooks));
retries over about 8 hours ([retries](https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/webhook-retries)).

Templates: "a customized version of Handlebars", `template=<name>` with `t:variables`
([templates](https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/send-templates)).

EU: region chosen at domain creation, base URL `https://api.eu.mailgun.net/`, "message data never
leaves the region in which it is processed"
([API overview](https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview));
Sinch [DPA](https://sinch.com/legal/terms-and-conditions/other-sinch-terms-conditions/data-protection-agreement/)
v8 incorporated by reference ([GDPR](https://www.mailgun.com/gdpr/)).

Gotchas: 1-day log retention means our own webhook store is the only delivery history; `v:`
variables are emitted in the delivered MIME unless suppressed; the tags-per-message limit is stated
as 3 in one doc and 10 in another.

### Amazon SES

Pricing: "$0.10 / 1,000 emails" and "$0.12 per GB of attachment data sent"; the free tier is now the
account-wide credits model: "New AWS customers will receive up to $200 in AWS Free Tier credits",
"The free plan will be available for 6 months after account creation"
([SES pricing](https://aws.amazon.com/ses/pricing/)). The older "3,000 messages a month for 12
months" SES tier does not appear on the pricing page. "A payment method isn't required to sign up
for most new customers" ([Free Tier FAQ](https://aws.amazon.com/free/free-tier-faqs/)); after the
free plan expires "your account closes automatically" unless upgraded
([free tier plans](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-plans.html)).
Phone verification at account creation could not be verified because the account-creation page is
client-rendered.

Sandbox: "You can only send mail to verified email addresses and domains, or to the Amazon SES
mailbox simulator", "a maximum of 200 messages per 24-hour period", "1 message per second"; the
production request is a console form (mail type, website URL, acknowledgement of a bounce and
complaint process) and "The AWS Support team provides an initial response to your request within 96
hours" ([production access](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html)).
Sandbox status is per region ([regions](https://docs.aws.amazon.com/ses/latest/dg/regions.html)).

API and SDK: `POST /v2/email/outbound-emails` on `email.<region>.amazonaws.com`, signed with
Signature Version 4 ([SendEmail](https://docs.aws.amazon.com/ses/latest/APIReference-V2/API_SendEmail.html),
[endpoints](https://docs.aws.amazon.com/general/latest/gr/ses.html)). The request has no
client-token field, so there is no idempotency key. `@aws-sdk/client-sesv2` 3.1161.0 (2026-10-30,
[npm](https://registry.npmjs.org/@aws-sdk/client-sesv2/latest)) uses `node:http` by default
([CLIENTS.md](https://raw.githubusercontent.com/aws/aws-sdk-js-v3/main/supplemental-docs/CLIENTS.md));
a maintainer wrote "AWS does not guarantee support for 3rd party offerings like Cloudflare Workers"
([issue 4765](https://github.com/aws/aws-sdk-js-v3/issues/4765)). SigV4 means a long-lived IAM access
key pair in the container, two secrets instead of one.

DNS: Easy DKIM publishes "three CNAME records" of the form `<token>._domainkey.<domain>` →
`<token>.dkim.amazonses.com` ([Easy DKIM](https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dkim-easy.html)).
A custom MAIL FROM "has to be a subdomain of the parent domain of a verified identity" and needs
exactly one MX `10 feedback-smtp.<region>.amazonses.com` plus TXT `v=spf1 include:amazonses.com ~all`
([MAIL FROM](https://docs.aws.amazon.com/ses/latest/dg/mail-from.html)); without it SPF cannot
align for DMARC ([DMARC](https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dmarc.html)).
No SES page mentions the Cloudflare proxy; the troubleshooting page covers only underscores,
appended domain names and lowercased values
([troubleshooting](https://docs.aws.amazon.com/ses/latest/dg/troubleshoot-verification.html)).

Testing: the mailbox simulator addresses "don't affect your daily sending quota" and "don't impact
your email deliverability or reputation metrics", but "we bill you the same amount"
([mailbox simulator](https://docs.aws.amazon.com/ses/latest/dg/send-an-email-from-console.html)).

Events: Send, RenderingFailure, Reject, Delivery, Bounce, Complaint, DeliveryDelay, Subscription,
Open, Click, published through a configuration set to CloudWatch, Firehose, SNS or EventBridge
([event publishing](https://docs.aws.amazon.com/ses/latest/dg/monitor-using-event-publishing.html)).
There is no direct HTTPS webhook; an SNS HTTPS subscription posts JSON signed with a certificate
the receiver must fetch and verify ([SNS signature](https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html)).
"you must have a system in place for managing bounces and complaints"
([notifications](https://docs.aws.amazon.com/ses/latest/dg/monitor-sending-activity-using-notifications.html)).

Templates: stored (`CreateEmailTemplate`) or inline Handlebars-style templates, `Simple` `Html`/`Text`,
`Raw` MIME; "SES doesn't escape HTML content when rendering the HTML template"
([templates](https://docs.aws.amazon.com/ses/latest/dg/send-personalized-email-api.html),
[advanced](https://docs.aws.amazon.com/ses/latest/dg/send-personalized-email-advanced.html)).

EU: seven EU regional endpoints; "We will not move or replicate your content outside of your chosen
AWS Region(s) without your agreement" ([data privacy FAQ](https://aws.amazon.com/compliance/data-privacy-faq/));
"These Service Terms incorporate the AWS Data Processing Addendum" ([service terms](https://aws.amazon.com/service-terms/)).

Gotchas: cheapest at scale and the most infrastructure for a hobby store (AWS account, IAM, a
configuration set, SNS topic and subscription confirmation handshake before the first bounce is
seen); the account auto-closes after the 6-month free plan unless upgraded.

### Cloudflare Email Sending (beta)

Status and price: "Email Sending is now in public beta" on 2026-04-16; "available on the Workers
paid plan" ([changelog](https://developers.cloudflare.com/changelog/post/2026-04-16-email-sending-public-beta/)).
The product page still carries the Beta label (last updated 2026-10-15), the product changelog's
newest of eleven entries is 2026-09-25 and none announces general availability
([changelog](https://developers.cloudflare.com/changelog/product/email-service/)), and the
Cloudflare blog has only the private-beta (2025-09-25) and public-beta
([2026-04-16](https://blog.cloudflare.com/email-for-agents/)) posts. The pricing page (last updated
2026-06-09) reads "Sending to arbitrary recipients requires the Workers Paid plan"; its table gives
Workers Free "Not available" and Workers Paid "3,000 included per month, then $0.35 per 1,000
emails". "The 3,000 included emails apply per account, per month, aligned with your Cloudflare
subscription billing cycle. Emails that hard-bounce or are otherwise accepted by Email Service count
toward the quota. Emails rejected at the API boundary, including sends blocked by the suppression
list, do not count toward the quota." "Sends to verified destination addresses are free and do not
count toward the included quota"
([pricing](https://developers.cloudflare.com/email-service/platform/pricing/)). Since this project
already pays for Workers Paid ([ADR 0005](../adr/0005-audiophile-runs-on-cloudflare-under-t-bendet-com.md)),
the marginal cost is zero, which puts it level with Resend's free plan at this store's volume rather
than ahead of it.

Limits and onboarding: before onboarding a domain, only verified destination addresses; "New
accounts start with a conservative daily quota and scale up over time based on your sending
behavior, deliverability rates, and account standing", "applied per account", with a Limit Increase
Request Form for anyone who needs more sooner; 25 MiB per message, 50 recipients, 998-character
subject, 16 KB of custom headers, 30 domains per zone
([limits](https://developers.cloudflare.com/email-service/platform/limits/), last updated
2026-10-30). The quota number is not published; hitting it surfaces as `E_DAILY_LIMIT_EXCEEDED`
from the binding or `429 email.sending.error.throttled` from REST. The FAQ adds "Email Service
supports transactional email only"
([FAQ](https://developers.cloudflare.com/email-service/reference/faq/)).

Sending: Workers binding, REST `POST /accounts/{account_id}/email/sending/send` with a Bearer API
token from "any backend, serverless function, or CI/CD pipeline", and "Cloudflare also provides
official SDKs for the REST API: Node, Python, and Go"
([REST API](https://developers.cloudflare.com/email-service/api/send-emails/rest-api/)). The Node
one is the whole-API `cloudflare` package, 7.3.0 published 2026-10-03, Apache-2.0, exposing
`client.emailSending.send()` and `sendRaw()` ([npm](https://registry.npmjs.org/cloudflare/latest),
[api.md](https://raw.githubusercontent.com/cloudflare/cloudflare-typescript/main/src/resources/email-sending/api.md));
a plain `fetch` is still the smaller dependency. Authenticated SMTP "now available in beta" since
2026-06-08: host `smtp.mx.cloudflare.net`, port 465, implicit TLS, username the literal `api_token`,
password an API token with **Email Sending: Edit**; "Plaintext SMTP, opportunistic `STARTTLS` on
port `587`, and unauthenticated relay on port `25` are not supported for outbound submission"
([SMTP](https://developers.cloudflare.com/email-service/api/send-emails/smtp/),
[changelog](https://developers.cloudflare.com/changelog/post/2026-06-08-smtp-submission/)). The REST
page's own examples show `to`, `from`, `subject`, `html`, `text`, `attachments` and `headers`; the
linked recipients example adds `cc`, `bcc` and `"reply_to": "support@yourdomain.com"`, and the
headers reference names the first-class fields as "`from`, `to`, `cc`, `bcc`, `subject`, `replyTo`
for Workers / `reply_to` for REST"
([recipients](https://developers.cloudflare.com/email-service/examples/email-sending/recipients/),
[headers](https://developers.cloudflare.com/email-service/reference/headers/)). No idempotency key
appears on the REST page, in the
[API reference](https://developers.cloudflare.com/api/resources/email_sending/methods/send/) (whose
only request headers are the three authentication schemes) or in the SDK's `EmailSendingSendParams`.
The REST token is account-wide: "Anyone with it can send email from any onboarded domain on the
matching account" ([SMTP](https://developers.cloudflare.com/email-service/api/send-emails/smtp/));
only the Workers binding can be narrowed with `allowed_sender_addresses` and
`allowed_destination_addresses`
([send bindings](https://developers.cloudflare.com/email-service/configuration/send-bindings/)).

DNS: "Email Sending creates DNS records on a `cf-bounce.` subdomain of your domain": three MX records
to `route1-3.mx.cloudflare.net`, SPF TXT `v=spf1 include:_spf.mx.cloudflare.net ~all`, DKIM TXT at
`cf-bounce._domainkey`, and DMARC at `_dmarc` (recommended start `p=none`); Cloudflare can "configure
all required DNS records for you when you onboard a domain"
([domains](https://developers.cloudflare.com/email-service/configuration/domains/)). The
deliverability page recommends separate subdomains for transactional and marketing mail
([deliverability](https://developers.cloudflare.com/email-service/concepts/deliverability/)).

Events: six types, `message.delivered`, `message.deferred`, `message.bounced`, `message.failed`,
`message.rejected`, `message.complained`; "Each subscription is scoped to one sending domain" and is
consumed from a queue "with Workers or HTTP pull consumers"; the page names no HTTPS webhook
destination
([event subscriptions](https://developers.cloudflare.com/email-service/reference/event-subscriptions/)).
The activity log shows statuses and keeps message previews "about seven days"
([activity log](https://developers.cloudflare.com/email-service/observability/logs/)).

Testing: "By default, `wrangler dev` simulates the email binding locally. It logs emails to the
console but does not send them"; a `remote: true` binding sends real mail from a local Worker; for
the REST API "you can test by sending requests directly with `curl`", with no simulated mode
mentioned
([local development](https://developers.cloudflare.com/email-service/observability/local-development/sending/)).
Sends to verified destination addresses are the free, uncounted path for exercising the real API.

Templates and EU: the Email Sending API resource exposes `send`, `send_raw`, suppressions and
subdomains and nothing template-shaped
([API resource](https://developers.cloudflare.com/api/resources/email_sending/)), and the docs
index lists no templates page ([llms.txt](https://developers.cloudflare.com/email-service/llms.txt)),
so hosted templates are absent rather than unverified. No Email Service page states where sent
messages or logs are stored, and the Data Localization Suite compatibility table has a row for Email
Routing but none for Email Sending
([compatibility](https://developers.cloudflare.com/data-localization/compatibility/)), so EU
residency stays unverified.

Gotchas for this repo: the container is a Node process, so it would use the REST API or SMTP, not
the binding, and so gets none of the local simulation and none of the binding-only sender and
recipient allowlists; the API token it holds can send from every onboarded domain in the account,
where a Resend key can be limited to one domain and to sending. Delivery events would need a Queues
consumer in the Worker that forwards to the container, or an HTTP pull loop, which is more plumbing
than a signed POST. The missing idempotency key matters most for order confirmation, where a retried
request must not send twice. `reply_to` and an official SDK, which an earlier draft of this note
listed as missing, are present.

## DNS records to add for `t-bendet.com` (Resend)

What the zone publishes today, read through DNS-over-HTTPS on 2026-11-02: an apex TXT
`v=spf1 include:_spf.porkbun.com ~all`, apex MX `10 fwd1.porkbun.com` and `20 fwd2.porkbun.com`
(Porkbun mail forwarding for the portfolio), and `_dmarc.t-bendet.com` TXT
`v=DMARC1; p=none; rua=mailto:…@dmarc-reports.cloudflare.net,mailto:…`. None of these change.

Send from the subdomain `mail.t-bendet.com`, not the apex. Resend recommends a subdomain
([domains](https://resend.com/docs/dashboard/domains/introduction)), and so do Mailgun and
Cloudflare; the concrete reason here is that the apex already carries the portfolio's forwarding MX
and SPF, so the store's bounces and complaints should build their own reputation rather than share
the portfolio's. The From address becomes something like `Audiophile <no-reply@mail.t-bendet.com>`.
These are plain DNS records, so the Universal SSL one-level limit recorded in ADR 0005 does not
apply; it would only matter for the optional click-tracking CNAME, which this plan omits.

Add the domain `mail.t-bendet.com` in Resend, pick the region, then add these records in the
Cloudflare DNS editor. The Name column is what goes in Cloudflare's Name field, which appends the
zone ("Use `send`, not `send.example.com`" per the [Cloudflare guide](https://resend.com/docs/dashboard/domains/cloudflare)).
Values in angle brackets are issued by Resend at setup time and must be copied from its dashboard.

| Type | Name                     | Value                                               | Proxy status                     | Note                                                                                                                                                                  |
| ---- | ------------------------ | --------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TXT  | `resend._domainkey.mail` | `p=<DKIM public key issued by Resend>`              | DNS only (TXT cannot be proxied) | DKIM. One TXT, not a CNAME.                                                                                                                                           |
| MX   | `send.mail`              | `feedback-smtp.<region>.amazonses.com`, priority 10 | DNS only (MX cannot be proxied)  | Return path. `<region>` is `eu-west-1` or `us-east-1` and must match the region chosen in Resend; if Cloudflare appends the zone, end the value with a dot.           |
| TXT  | `send.mail`              | `v=spf1 include:amazonses.com ~all`                 | DNS only                         | SPF for the return-path host. New name, so nothing to merge.                                                                                                          |
| TXT  | `_dmarc`                 | existing `v=DMARC1; p=none; rua=…`                  | n/a                              | Already present. No `sp=` tag, so the `p=none` policy applies to `mail.t-bendet.com` as well (RFC 7489 §6.3). Tighten to `quarantine` after a clean month of reports. |

Cloudflare's own reference states the proxy rule: "Only records used for IP address resolution — A,
AAAA, and CNAME records — can be proxied", and "Records used for other purposes, such as CNAME
records that prove your domain ownership, should not be proxied"
([proxied DNS records](https://developers.cloudflare.com/dns/manage-dns-records/reference/proxied-dns-records/)).
TXT and MX records therefore cannot be set wrong; the orange cloud only becomes a trap if the
optional `links.mail` CNAME → `links1.resend-dns.com` is ever added for click tracking, and that
record must be DNS only.

Existing-record check: the SPF merge rule ("if the domain already has an SPF TXT, extend it rather
than adding a second") does not bite because Resend's SPF lives on `send.mail.t-bendet.com`, a name
with no records today. The same is true if the apex were used as the sending domain instead
(records would land on `send.t-bendet.com` and `resend._domainkey.t-bendet.com`). The apex SPF and
Porkbun MX stay untouched either way. The DMARC record already exists; do not add a second
`_dmarc` TXT.

## Secrets and configuration the server will need

This is a design note for the group 1 spec, not an implementation. The roadmap constraint applies:
"Every external provider ... is a Worker secret, the Worker's env forwarding and the server env
schema", and "Test doubles for email and payments switch on `NODE_ENV=test` only, never on a second
variable" ([roadmap](../ROADMAP.md)).

Proposed names:

| Name                   | Kind          | Value                                                                                        | Needed when                                                             |
| ---------------------- | ------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `EMAIL_API_KEY`        | Worker secret | Resend key created with `sending_access` and restricted to `mail.t-bendet.com`               | Production only; the schema requires it only when `NODE_ENV=production` |
| `EMAIL_FROM`           | Plain var     | Bare address, e.g. `no-reply@mail.t-bendet.com`; the display name "Audiophile" lives in code | Always; validated with `z.email()`                                      |
| `EMAIL_WEBHOOK_SECRET` | Worker secret | Resend webhook signing secret (`whsec_…`)                                                    | Only when the bounce/complaint webhook slice lands; absent until then   |

`EMAIL_FROM` is deliberately a bare address so that the existing `z.email()` validation shape can be
reused and the display name does not need quoting rules in a `.env` file. Reply-to, if wanted, is a
second plain var later; it is listed under open questions.

Files to touch, in the order the deployment runbook names them
([deployment](../deployment.md#production-environment)):

1. [`apps/server/wrangler.jsonc`](../../apps/server/wrangler.jsonc): add `EMAIL_FROM` to `vars`.
   `EMAIL_API_KEY` is not written here; it is set with `pnpm exec wrangler secret put EMAIL_API_KEY`
   from `apps/server`, which the runbook's secret list must gain alongside `DATABASE_URL` and
   `JWT_SECRET`.
2. [`apps/server/worker/index.ts`](../../apps/server/worker/index.ts): add `EMAIL_FROM` and
   `EMAIL_API_KEY` to the `Env` interface and to the `this.envVars` block in the `ApiContainer`
   constructor; the container sees only what that block forwards.
3. [`apps/server/src/utils/env.ts`](../../apps/server/src/utils/env.ts): add `EMAIL_FROM: z.email()`
   and `EMAIL_API_KEY: z.string().min(1).optional()` to `EnvSchema`, and extend the existing
   `.refine` that already makes `DATABASE_URL` production-only strict so that `EMAIL_API_KEY` is
   required when `NODE_ENV === "production"`. The same file's `LOG_LEVEL_DEFAULTS` is the precedent
   for a per-`NODE_ENV` table.
4. [`apps/server/.env.example`](../../apps/server/.env.example): add `EMAIL_FROM=no-reply@mail.t-bendet.com`
   and a commented `# EMAIL_API_KEY=` line explaining it is unused in development.
5. [`apps/server/.dev.vars.example`](../../apps/server/.dev.vars.example): add `EMAIL_FROM`. That
   file runs the local container with `NODE_ENV=test`, so no key is needed there.
6. [`docs/deployment.md`](../deployment.md): the "Production environment" paragraph counts "four
   `vars`" and "two secrets"; update the counts and the `wrangler secret put` list, and the
   first-deploy checklist that tells a fork what to configure.
7. [`apps/e2e/playwright.config.ts`](../../apps/e2e/playwright.config.ts): the `webServer` env block
   that starts the server with `NODE_ENV=test` must also pass `EMAIL_FROM` once the schema requires
   it.

Transport selection keyed on `NODE_ENV` alone, following the shape of `defineLimiter` in
[`rateLimiters.ts`](../../apps/server/src/utils/rateLimiters.ts), which stands every limiter down
under `NODE_ENV=test` with no second variable:

- `test`: an in-memory outbox. The mailer pushes the rendered message (`to`, `subject`, `text`,
  `html`, idempotency key) onto an array; a helper beside `resetDatabase` in
  [`test/helpers/database.ts`](../../apps/server/test/helpers/database.ts) reads and clears it, so a
  route test can assert that a reset request produced exactly one message to the right address and
  pull the token out of the link. No network, no key.
- `development`: a log transport. The same rendered message is written through the pino logger at
  `info`, so the developer sees the reset link in the terminal. No key, so a fresh clone works with
  the existing `.env.example` plus `EMAIL_FROM`. This is the one behaviour that is not "test-only",
  and it is still keyed on `NODE_ENV`, not on a new flag.
- `production`: Resend over HTTPS. `Idempotency-Key` is derived from the business event, in Resend's
  recommended `<event-type>/<entity-id>` form: `order-confirmation/<orderId>` and
  `password-reset/<userId>/<passwordResetExpires>`; keys are kept 24 hours, long enough to cover a
  retried request and short enough not to block a second legitimate reset.

Verifying real delivery without a fourth mode: after the first deploy, request a password reset for
your own address on `audiophile.t-bendet.com`, or send to `delivered@resend.dev` and
`bounced@resend.dev` from a one-off script with the production key; those count against the 3,000
quota but exercise the real path.

The E2E suite starts the server under `NODE_ENV=test`, so it gets the outbox too, but
[`apps/e2e`](../../apps/e2e/README.md) tests over HTTP and does not import server code, so a reset
E2E cannot read the array directly. The least-new-machinery option is a route that exists only under
`NODE_ENV=test` and returns and clears the outbox; that is test-only behaviour keyed on the one
variable the rule allows. The alternative is for the E2E test to read `passwordResetToken` from the
`audiophile-e2e` database, which breaks the suite's no-application-imports stance less cleanly. This
is an open question below.

Webhooks are not needed for group 1. Password reset and order confirmation only send. When the
status-notification slice in group 3 wants bounce and complaint handling, the Resend webhook posts
to a route under `/api/v1/…`, which already reaches the container through the Worker's
`run_worker_first` rule, and is verified with `resend.webhooks.verify` against the raw body using
`EMAIL_WEBHOOK_SECRET`. The Free plan allows one endpoint, which is enough.

## Decisions

Settled 2026-11-02 after the re-verification above. These answer the questions the first draft left
open.

1. **From address: `no-reply@mail.t-bendet.com`.** The apex keeps the portfolio's Porkbun forwarding
   MX and SPF; the store's bounces and complaints build their own reputation on the subdomain. The
   DNS table above is final.
2. **Resend region: `eu-west-1`.** Stored data is in the United States whichever region is chosen, so
   this sets only the dispatch location and the `send.mail` MX value. Ireland is the nearer hop for
   recipients in Europe and the Middle East. The region is fixed per domain, so it is set once when
   the domain is added.
3. **No reply-to.** Password resets and order confirmations are no-reply by nature and the store has
   no support inbox behind replies. Adding one later is a single optional plain var, `EMAIL_REPLY_TO`.
4. **The password-reset E2E reads the token from a `NODE_ENV=test`-only outbox route.** The E2E app
   drives the system over HTTP and imports no application packages, so a direct database read would
   cross that boundary; the reset token is stored hashed, so the database cannot yield it anyway; and
   mounting the route only under `NODE_ENV=test` is how the rate limiters are already disabled, so it
   adds no second toggle. The route is absent, a JSON 404, in every other environment.
5. **Raw HTML strings in the server, with a plain-text alternative.** Two emails at this volume do not
   justify React Email's render dependency and JSX in the server build, and hosted templates would
   move content out of the repo and out of the outbox assertions. Small template functions keep the
   copy reviewable and testable.
6. **This decision is not reopened at Cloudflare Email Sending's general availability.** The store is
   a low-volume portfolio project; Resend is free at this volume and the switch would buy nothing.
   The paragraph under Recommendation records what Cloudflare would need to offer, for the record,
   not as a plan.

## Sources

Cloudflare platform

- https://developers.cloudflare.com/containers/platform-details/outbound-traffic/
- https://developers.cloudflare.com/containers/platform-details/
- https://developers.cloudflare.com/containers/faq/
- https://developers.cloudflare.com/containers/platform-details/limits/
- https://developers.cloudflare.com/dns/manage-dns-records/reference/proxied-dns-records/
- https://developers.cloudflare.com/dns/manage-dns-records/reference/dns-record-types/
- https://developers.cloudflare.com/email-routing/
- https://developers.cloudflare.com/email-service/
- https://developers.cloudflare.com/email-service/platform/pricing/
- https://developers.cloudflare.com/email-service/platform/limits/
- https://developers.cloudflare.com/email-service/get-started/send-emails/
- https://developers.cloudflare.com/email-service/configuration/domains/
- https://developers.cloudflare.com/email-service/api/send-emails/rest-api/
- https://developers.cloudflare.com/email-service/api/send-emails/smtp/
- https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
- https://developers.cloudflare.com/email-service/configuration/send-bindings/
- https://developers.cloudflare.com/email-service/reference/headers/
- https://developers.cloudflare.com/email-service/reference/faq/
- https://developers.cloudflare.com/email-service/examples/email-sending/recipients/
- https://developers.cloudflare.com/email-service/reference/event-subscriptions/
- https://developers.cloudflare.com/email-service/observability/logs/
- https://developers.cloudflare.com/email-service/observability/local-development/sending/
- https://developers.cloudflare.com/email-service/concepts/deliverability/
- https://developers.cloudflare.com/email-service/llms.txt
- https://developers.cloudflare.com/api/resources/email_sending/
- https://developers.cloudflare.com/api/resources/email_sending/methods/send/
- https://developers.cloudflare.com/data-localization/compatibility/
- https://developers.cloudflare.com/changelog/post/2026-04-16-email-sending-public-beta/
- https://developers.cloudflare.com/changelog/post/2026-05-28-named-email-recipients/
- https://developers.cloudflare.com/changelog/post/2026-06-08-smtp-submission/
- https://developers.cloudflare.com/changelog/product/email-service/
- https://blog.cloudflare.com/email-for-agents/
- https://registry.npmjs.org/cloudflare/latest
- https://raw.githubusercontent.com/cloudflare/cloudflare-typescript/main/src/resources/email-sending/api.md

Resend

- https://resend.com/pricing
- https://resend.com/docs/knowledge-base/what-is-resend-pricing
- https://resend.com/legal/terms-of-service
- https://resend.com/docs/knowledge-base/403-error-resend-dev-domain
- https://resend.com/docs/api-reference/emails/send-email
- https://resend.com/docs/api-reference/introduction
- https://resend.com/docs/api-reference/rate-limit
- https://resend.com/docs/api-reference/api-keys/create-api-key
- https://resend.com/docs/dashboard/emails/idempotency-keys
- https://resend.com/docs/api-reference/domains/create-domain
- https://resend.com/docs/dashboard/domains/introduction
- https://resend.com/docs/dashboard/domains/cloudflare
- https://resend.com/docs/knowledge-base/what-if-my-domain-is-not-verifying
- https://resend.com/docs/dashboard/domains/dmarc
- https://resend.com/docs/dashboard/domains/regions
- https://resend.com/docs/dashboard/emails/send-test-emails
- https://resend.com/docs/dashboard/webhooks/event-types
- https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests
- https://resend.com/docs/webhooks/retries-and-replays
- https://resend.com/docs/dashboard/templates/introduction
- https://resend.com/docs/send-with-cloudflare-workers
- https://resend.com/security/gdpr
- https://resend.com/legal/dpa
- https://resend.com/legal/subprocessors
- https://registry.npmjs.org/resend/latest
- https://raw.githubusercontent.com/resend/resend-node/main/package.json
- https://raw.githubusercontent.com/resend/resend-node/main/src/resend.ts
- https://raw.githubusercontent.com/resend/resend-node/main/src/render.ts

Postmark

- https://postmarkapp.com/pricing
- https://postmarkapp.com/support/article/1107-how-does-monthly-pricing-work
- https://postmarkapp.com/support/article/1084-how-does-the-account-approval-process-work
- https://postmarkapp.com/developer/api/email-api
- https://postmarkapp.com/support/article/what-is-an-idempotency-key
- https://postmarkapp.com/support/article/1046-how-do-i-verify-a-domain
- https://postmarkapp.com/support/article/setting-up-dkim-for-your-domain
- https://postmarkapp.com/support/article/1102-why-is-it-not-required-to-include-postmark-in-our-own-custom-spf-record
- https://postmarkapp.com/support/article/adding-dkim-and-return-path-records-to-cloudflare
- https://postmarkapp.com/developer/user-guide/sandbox-mode/server-sandbox-mode
- https://postmarkapp.com/support/article/1213-best-practices-for-testing-your-emails-through-postmark
- https://postmarkapp.com/support/article/1100-templates-faq
- https://postmarkapp.com/developer/webhooks/webhooks-overview
- https://postmarkapp.com/support/article/800-ips-for-firewalls
- https://postmarkapp.com/developer/api/templates-api
- https://postmarkapp.com/support/article/1218-gdpr-faq
- https://postmarkapp.com/eu-privacy
- https://postmarkapp.com/dpa
- https://registry.npmjs.org/postmark/latest
- https://raw.githubusercontent.com/ActiveCampaign/postmark.js/main/README.md
- https://raw.githubusercontent.com/ActiveCampaign/postmark.js/main/CHANGELOG.md

Mailgun

- https://www.mailgun.com/pricing/
- https://help.mailgun.com/hc/en-us/articles/203068914-What-does-the-Free-plan-offer
- https://help.mailgun.com/hc/en-us/articles/203637190-How-can-I-add-or-delete-a-domain
- https://help.mailgun.com/hc/en-us/articles/217531258-Authorized-Recipients
- https://help.mailgun.com/hc/en-us/articles/8841411163035-Adjusting-a-domain-s-message-retention-settings
- https://help.mailgun.com/hc/en-us/articles/37182933150491-Account-Activation
- https://help.mailgun.com/hc/en-us/articles/202850080-Why-did-I-receive-the-error-Business-verification-is-required
- https://help.mailgun.com/hc/en-us/articles/15585722150299-Cloudflare-DNS-Setup-Guide
- https://help.mailgun.com/hc/en-us/articles/32884700912923-Domain-Verification-Setup-Guide
- https://help.mailgun.com/hc/en-us/articles/360011566033-HTTPS-Tracking-Links
- https://help.mailgun.com/hc/en-us/articles/202256730-What-domain-name-should-I-use-with-Mailgun
- https://documentation.mailgun.com/docs/mailgun/faq/faqs
- https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun/messages/post-v3--domain-name--messages
- https://documentation.mailgun.com/docs/mailgun/api-reference/authentication
- https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview
- https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/test-mode
- https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/send-templates
- https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/securing-webhooks
- https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/webhook-retries
- https://www.mailgun.com/gdpr/
- https://sinch.com/legal/terms-and-conditions/other-sinch-terms-conditions/data-protection-agreement/
- https://registry.npmjs.org/mailgun.js/latest
- https://raw.githubusercontent.com/mailgun/mailgun.js/master/README.md

Amazon SES

- https://aws.amazon.com/ses/pricing/
- https://aws.amazon.com/free/free-tier-faqs/
- https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-plans.html
- https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html
- https://docs.aws.amazon.com/ses/latest/dg/regions.html
- https://docs.aws.amazon.com/ses/latest/APIReference-V2/API_SendEmail.html
- https://docs.aws.amazon.com/general/latest/gr/ses.html
- https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dkim-easy.html
- https://docs.aws.amazon.com/ses/latest/dg/mail-from.html
- https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dmarc.html
- https://docs.aws.amazon.com/ses/latest/dg/troubleshoot-verification.html
- https://docs.aws.amazon.com/ses/latest/dg/send-an-email-from-console.html
- https://docs.aws.amazon.com/ses/latest/dg/monitor-using-event-publishing.html
- https://docs.aws.amazon.com/ses/latest/dg/monitor-sending-activity-using-notifications.html
- https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
- https://docs.aws.amazon.com/ses/latest/dg/send-personalized-email-api.html
- https://docs.aws.amazon.com/ses/latest/dg/send-personalized-email-advanced.html
- https://aws.amazon.com/compliance/data-privacy-faq/
- https://aws.amazon.com/service-terms/
- https://registry.npmjs.org/@aws-sdk/client-sesv2/latest
- https://raw.githubusercontent.com/aws/aws-sdk-js-v3/main/supplemental-docs/CLIENTS.md
- https://github.com/aws/aws-sdk-js-v3/issues/4765

Standards and live DNS

- RFC 7489 §6.3, `sp` tag: https://www.rfc-editor.org/rfc/rfc7489#section-6.3
- `t-bendet.com` TXT, MX and `_dmarc` TXT read via https://dns.google/resolve on 2026-11-02
