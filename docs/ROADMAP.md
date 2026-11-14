# Roadmap

Planned and candidate features, grouped in the order they will be built. Items here are intent,
not specced work: a group becomes GitHub issues when its turn comes, following the
[issue workflow](agents/issue-tracker.md). Dark mode and multi-language support are not planned.

The grouping was drawn up on 2026-11-02 against the code at that date; the facts quoted in each
group were checked then. Group 0, the debt sprint, closed in
[#340](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/340), and group 1, email
foundation and account recovery, in
[#350](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/350), both on 2026-11-02; group
2, storefront loading states and dialogs, closed in
[#358](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/358) on 2026-11-03; group 3,
order tracking, history and notifications, closed in
[#437](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/437) on 2026-11-04. What they
settled is folded into the blocks below, which were checked again at each close. Group 4 remains
next to grow the catalogue; the order of groups 5 to 9 is provisional and is reconsidered at every
group boundary.

## How the roadmap is worked

**One group at a time.** A group becomes a parent issue, one sub-issue per vertical slice and a
closing re-triage, in the shapes the [roadmap group guide](agents/roadmap-group.md) holds; a
session brief, a wayfinder destination or a hand-written parent points there instead of restating
them. The parent issue is where the group's decisions live; this file names the questions, never
the answers. A slice's PR removes its item line here and corrects any fact its change made false;
the closing re-triage removes the group block. The guide's standing criteria are what
[batch-tickets](../.agents/skills/batch-tickets/SKILL.md) checks and, under `mattpocock-skills:implement`, what code
review's spec axis reads.

**Pick the entry skill by how many decisions the group has open.**

- No open decision: write the issues directly from this file, as group 0
  ([#340](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/340)) was. Run
  [roadmap-batch](../.agents/skills/roadmap-batch/SKILL.md) only when they should also be shipped in
  the same session; it hands the queue to batch-tickets.
- One decision or one design pass (group 7): write the parent issue from the guide first, then run
  `mattpocock-skills:to-tickets` against it so the human session becomes its
  first sub-issue, labelled `ready-for-human`, and the agent slices are specced in the same pass,
  as [#350](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/350) was for group 1 with
  its research session #351 and its design pass #352, and
  [#358](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/358) for group 2 with its prototype session #359. The
  human ticket runs the matching skill:
  `mattpocock-skills:research` for a provider comparison,
  `mattpocock-skills:prototype` for a UI question,
  `mattpocock-skills:grilling` for semantics. Its close amends the slices the
  decision changed; then the slice numbers go to
  [batch-tickets](../.agents/skills/batch-tickets/SKILL.md), or the parent number alone, which it
  resolves to the open sub-issues in blocking order.
- Several interlocking decisions of different kinds (groups 4, 5, 6, 8): open a
  `mattpocock-skills:wayfinder` map for that group only. Group 4 is the model
  case: the upload shape, the variant strategy, the upload path and the category question each
  change the others' answers; one needs research, one a prototype, one is a product call; together
  they exceed one session, and the map's frontier shows which is decidable next while its fog holds
  the questions other groups hand it. One map for the whole roadmap was rejected: the groups are
  sequential by choice, not by blocking, so a frontier adds nothing across them; far tickets would
  be answered against code that has moved by the time they matter; and the map would become a
  second backlog beside this file.

**Handling change midway.**

- Humans decide for group N+1 while agents ship group N. The human ticket is the first sub-issue of
  every group, so the agent slices it blocks can run as one batch once it closes.
- The first slice of a group that introduces a new seam (an upload path, a payment webhook; the
  email transport in #353 was the first) stops at PR open for a hand review; the rest of the batch
  auto-merges on green.
- Group-scoped decisions live in the parent issue and its comments. Durable ones become ADRs, as the
  catalogue ownership change did in
  [ADR 0007](adr/0007-the-database-owns-the-catalogue-after-first-publish.md), the email
  transport in [ADR 0011](adr/0011-email-leaves-through-one-transport-that-node-env-selects.md)
  and the storefront loading pattern in
  [ADR 0013](adr/0013-a-storefront-navigation-keeps-the-old-page-under-a-progress-bar.md). When a batch
  shows an assumption was wrong: stop the batch, update the parent issue, re-spec only the slices
  still open.
- Every group ends with a closing re-triage ticket, blocked by every other slice, so the batch cannot
  finish without it. Its PR closes the parent and stops at PR open for review. The checklist under
  "Closing re-triage" is its acceptance criteria.
- Every slice ships its own E2E. The test suite is not an epic of its own; group 0 cleared the known
  gaps once ([#341](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/341) to
  [#343](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/343)). A flow only the phone
  layout shows gets its spec under `apps/e2e/tests/mobile/`, as the E2E guide's
  [Projects](../apps/e2e/README.md#projects) section describes.

**Constraints every group inherits.**

- [ADR 0007](adr/0007-the-database-owns-the-catalogue-after-first-publish.md): `db:sync` no longer
  updates existing documents, so every new catalogue field (arrival date, archived, stock,
  attributes, rating aggregates) needs a backfill or must be optional; Prisma on MongoDB fails a read
  when a required field is missing from a document. The first group to add one establishes the
  migration pattern and records it as an ADR.
- Every external provider (R2 write access, a payment gateway; email is wired) is a Worker secret,
  the Worker's env forwarding and the server env schema, as the [deployment runbook](deployment.md)
  describes. `EMAIL_API_KEY` is the precedent: #351 provisioned it, #353 wired it. A human
  provisions; an agent wires. Any server variable reaches seven places, listed in
  [ADR 0011](adr/0011-email-leaves-through-one-transport-that-node-env-selects.md), as `EMAIL_FROM`
  and `CLIENT_URL` did; an existing local `apps/server/.env` needs a new required one added by
  hand.
- Test doubles switch on `NODE_ENV=test` only, never on a second variable. The email double is the
  in-memory outbox of
  [ADR 0011](adr/0011-email-leaves-through-one-transport-that-node-env-selects.md), read directly by route tests and over HTTP by E2E through `GET /api/v1/test/outbox?to=` on a
  router mounted only under test. A payment gateway stub takes the same shape, and a route E2E
  needs for it joins that router.
- Every email is a template function in `apps/server/src/emails` (raw HTML plus text) and a method
  on `email.service.ts` that sends it with an `Idempotency-Key` named after its business event,
  awaited, logged on failure and never failing the request. Its links are built on `CLIENT_URL`,
  never the request's `Host`
  ([ADR 0011](adr/0011-email-leaves-through-one-transport-that-node-env-selects.md)). Any password
  write ends the user's other sessions
  ([ADR 0012](adr/0012-a-password-reset-link-works-once-and-is-stored-only-as-its-hash.md)).
- `media:sync --prune` deletes any bucket key the repo does not have. The first dashboard upload
  makes it destructive, so the upload slice scopes or retires it.
- Every DTO member is required and the schema is strict
  ([ADR 0009](adr/0009-field-selection-never-drops-a-required-member.md)). The admin role change
  derives last-active-admin state from an active-admins list total; the self-user response instead
  includes `soleActiveAdmin` for the security page.
- Order status events are embedded and written atomically with the status; existing orders without
  events read as a synthetic Pending event at creation time. Actors are a user id or `system`, and
  payment changes are separate ([ADR 0015](adr/0015-order-status-events-are-embedded-in-orders.md)).
- Nothing an order references is hard-deleted
  ([ADR 0010](adr/0010-nothing-an-order-references-is-hard-deleted.md)): users are deactivated, and
  `DELETE /products/:id` answers `RESOURCE_IN_USE` (409) for a product with order items or in a site
  config slot.
- A new storefront route awaits its data in the loader and reads its params from `useParams`;
  `PendingOutlet` keeps the old page under the "Loading page" progress bar meanwhile, and nothing
  renders a skeleton
  ([ADR 0013](adr/0013-a-storefront-navigation-keeps-the-old-page-under-a-progress-bar.md)). A
  search-param change on the same pathname shows no pending state. An E2E that asserts a pending
  state starts with a cold cache and holds the API with `holdRoute`
  ([E2E fixtures](../apps/e2e/README.md#fixtures)). The root overlay fires for logout only; a form
  shows pending on its submit button.
- Every dialog is `ui/dialog` with a `placement` (`sheet-top`, `sheet-top-end`, `centred`) and a
  `title`; `belowNav` is the only nav offset, and the overlay's `dialog-overlay` is the client's
  only test id ([ADR 0014](adr/0014-every-dialog-is-one-radix-primitive-with-a-placement.md)).
  A fourth placement is a change to the primitive, not an override at a call site.
- A form that must survive a refetch rebases in place: a save resets it to the response, as the
  product, homepage and order fulfilment forms do
  ([#366](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/366), [client guide](../apps/client/README.md#orders)); it is never keyed on the data it edits.
- An E2E spec that places an order or changes the catalogue holds `ORDERS_LOCK` or
  `CATALOGUE_LOCK`, puts back through the API what it changed, and never orders a disposable
  product ([E2E fixtures](../apps/e2e/README.md#fixtures)).

**Closing re-triage.** The checklist each group's last sub-issue carries; it ran as
[#347](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/347) for group 0,
[#357](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/357) for group 1 and
[#363](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/363) for group 2, and
[#445](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/445) for group 3.

1. The closed group's block and any item lines still standing are removed.
2. Every decision settled in the parent issue, its slices or their PR reviews that differs from what
   this file or an ADR says is recorded: as a corrected fact here, and as a new or amended ADR when
   it is durable.
3. Every remaining group block has been read against what shipped. A dependency now satisfied, a
   quoted code fact now false, a seam now in place, or a constraint now added or lifted is corrected
   in that block.
4. "Constraints every group inherits" reflects anything the group added or removed: a new secret, a
   new test double, a migration pattern.
5. The next group's session brief is still true; stale facts in it are fixed before anyone starts
   from it.
6. Items the group parked or unparked are moved, each with its reason.
7. The PR body states whether the remaining groups keep their order, with the reason either way, and
   the edit applies any change it proposes.
8. The PR carries `Closes #<parent>` and waits at PR open for review.

## Groups in order

### 4. Catalogue growth: uploads, product creation, categories

- Image uploads from the admin dashboard. Images are files in `packages/media`, published to R2 by
  `pnpm --filter @repo/media media:sync` with developer credentials through the S3 SDK; the server
  has no R2 credential. The global JSON body limit is 10 kB. A full product is seven image roles
  with three hand-cut crops each, so a naive upload form means around twenty files per product. The
  domain's image key pattern already accepts `webp` and `avif`.
- Product creation from the dashboard. The server's admin create endpoint exists and nothing in the
  client calls it; the E2E suite creates disposable products through it, borrowing a showcase
  product's image keys. A new product needs image keys that exist in the bucket, which is why this
  waits on uploads ([ADR 0007](adr/0007-the-database-owns-the-catalogue-after-first-publish.md)).
  The server does not check that today, so a slice that adds bucket validation keeps an E2E way to
  create a product, or `apps/e2e/tests/admin-catalogue.spec.ts` breaks.
- Category management. Three fixed categories are a product decision; category thumbnails are
  images, so this also waits on uploads. The server's category create, update and delete endpoints
  exist and are unused.
- Replace the `NAME` enum on `Category` with `name: String` + `slug: String @unique`. Touches the
  Prisma enum, the domain Zod schemas, the `/categories/:category/products` route, `config/paths.ts`,
  the category page and `seo/metadata.tsx`. Only pays off once categories are created at runtime.
- WebP or AVIF variants. Nothing generates variants; the originals are pre-cut per breakpoint.
  Either a media package job that puts siblings in the manifest, or Cloudflare Image Transformations
  at the URL, which would also cover uploaded images. `ResponsivePicture` would only consume them.
- `isNewProduct` as a value derived from an arrival date. No such date exists today (only
  `createdAt`, which is seed time); a new optional field plus a rule such as "less than a year old",
  set in the creation form. The first catalogue field added after ADR 0007, so this sets the
  migration pattern.

Why next: the longest pole with the most human decisions. Nothing downstream (filter, search, archive, inventory) is worth much on a six-product catalogue.
Unblocks: groups 5 and 6 in practice.

Human first, as a wayfinder map: what an admin uploads per product (per-role-per-breakpoint crops as
today, or one original per role with derived sizes); if derived, where (sharp in the container or
Cloudflare Image Transformations); the upload path (presigned PUT from the browser or multipart
through Express); whether runtime categories are wanted at all. If categories stay fixed, category
management and the enum replacement park here with that reason. Provisioning: an R2 token as a
Worker secret, bucket CORS if presigned. Then a design pass for the upload UI; its dialogs are
`centred` `ui/dialog`s, whose overlay covers the whole admin shell since
[#362](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/362)
([ADR 0014](adr/0014-every-dialog-is-one-radix-primitive-with-a-placement.md)).

Size: L, six to eight agent tickets, one map, one design pass.

### 5. Product lifecycle: archive, inventory, availability

- Product delete or archive. Since
  [#345](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/345), deleting a product with
  order items or in a homepage slot answers `RESOURCE_IN_USE` (409)
  ([ADR 0010](adr/0010-nothing-an-order-references-is-hard-deleted.md)). Cart items still cascade
  and silently vanish; the route test "removes the product's cart items and leaves the other lines"
  in `apps/server/test/product.route.test.ts` records that as the baseline this group changes.
  Archive is still the answer: order lines read the product's name and image live, so an ordered
  product can never be removed. Needs an "unavailable" or "archived" state.
- Inventory management. No stock field exists. Checkout creates the order and empties the cart in
  one transaction with no stock check; that transaction is where a decrement with an oversell guard
  goes.
- The availability flag that group 6's filter consumes. Slots, related products and the sitemap
  must exclude archived products.

Depends on: group 4's migration pattern, and a catalogue to manage. Swap it ahead of group 4 if the
upload decisions stall. Unblocks: the availability filter, a dashboard delete button (the API
already refuses an ordered product; archive is what that product gets instead), hiding archived
products from wishlists.

Human first: a wayfinder map or a single grilling session on semantics, not visuals: cart lines
holding an archived product, a slot holding one, the product page for one, restock on cancel, the
oversell policy, a low-stock threshold.

Size: M to L, five or six agent tickets and one decision session.

### 6. Finding products: filtering and search

- Advanced product filtering: price range, features, availability. The products list accepts
  `sort`, `fields`, `page`, `limit` and an exact `name` only; the category endpoint takes no
  parameters and no pagination; features are prose paragraphs, so a features filter needs a
  structured attributes field, captured at creation if group 4 is still open.
- Product search: full-text, autocomplete, highlighting. No text index exists; the only search in
  the API is the admin users list.
- Full-text order search over names and addresses for the admin list, which filters on order id,
  customer email, status, payment status and user today. Small and independent; here because it
  shares the index decision.

Depends on: groups 4 and 5. A search results route gets group 2's pending state
([ADR 0013](adr/0013-a-storefront-navigation-keeps-the-old-page-under-a-progress-bar.md)), but a
filter or query change on the same pathname gets none. Human first: the search technology (a
MongoDB text index runs on the local replica set and in route tests; Atlas Search has autocomplete
and highlighting but changes the test seam), whether features become attributes, and a design pass
for the filter bar and the nav search box, which the storefront design does not have, including
what each shows while results load. Recommendation at triage time: a text index with prefix
matching and client-side highlighting until the catalogue is hundreds of products.

Size: M, four or five agent tickets and one design pass.

### 7. Shopper engagement: wishlist and reviews

- Wishlist. Nothing exists; login-only would match checkout, guest-capable would match the cart.
- Product reviews and ratings. Nothing exists. Eligibility can check the existing Delivered status on orders; the policy for who may review
  remains open. A rating sort joins group 6 as a follow-up.

Depends on: group 5 for archived-product visibility; group 3's order status is in place. The
account wishlist page follows group 2's loading pattern
([ADR 0013](adr/0013-a-storefront-navigation-keeps-the-old-page-under-a-progress-bar.md)).
Swappable with group 6. Human first: wishlist scope, who may review and whether admin moderates,
and a design pass for the product page sections, the card control and the account wishlist page.

Size: M to L, five or six agent tickets and one design pass.

### 8. Checkout and payments

- Payment gateway. The payment method is a free string the client sets; Paid and Refunded are set by
  hand. The gateway replaces the manual toggles. Since
  [#353](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/353) the checkout's methods are
  `PAYMENT_METHODS` in `@repo/domain`, and the order-received email and the thank-you dialog
  (`apps/client/src/features/orders/components/order-confirmation.tsx`) both print
  `paymentInstructions(method)` from the same package, so the gateway rewrites that sentence
  in one place plus the tests that assert it (`order.route.test.ts`, `order.spec.ts` and the domain
  test).
- Coupling between payment status and order status. "Refund requires paid" is already enforced by
  the payment transition table; "cancel implies refund" is not, and arrives with the gateway.
- Checkout enhancement: address book, multiple payment methods. The address book is user-owned
  addresses, an account page, checkout prefill and the missing "same as shipping" toggle; it does
  not need the gateway and can be pulled forward as a separate account slice if wanted sooner.
  Checkout stays login-only; guest checkout is not planned. Observed in
  [#341](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/341) and not fixed: the address
  schemas accept whitespace-only values, and every checkout input is `required` without
  `noValidate`, so the form's own "is required" messages never show. The checkout design pass
  decides whether the browser or the schema reports an empty field. Since
  [#362](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/362) the thank-you is a `centred` dialog over
  the emptied checkout page
  ([ADR 0014](adr/0014-every-dialog-is-one-radix-primitive-with-a-placement.md)); the
  "Your cart is empty" heading under it sets no colour on the white body text and is invisible
  (found in #359), so the pass owns the empty state too.

Why late: the highest risk and the most human setup, while the manual flow works. For a webhook: a
raw-body route mounted before the global JSON parser; the container is single-instance, sleeps after
ten idle minutes and cold-starts in about four seconds, so lean on the provider's retries.

The order event actor already accepts `system` for webhook-driven status moves; payment changes
remain separate from status events ([ADR 0015](adr/0015-order-status-events-are-embedded-in-orders.md)).
Human first, as a wayfinder map: the gateway and integration
style (hosted page or embedded elements), the provider account, test keys and webhook secret, and a
checkout design pass. Test double: a gateway stub shaped like the email transport
([ADR 0011](adr/0011-email-leaves-through-one-transport-that-node-env-selects.md)): one module
selects it from `NODE_ENV` alone, and a route E2E needs joins the test-only `/api/v1/test` router.
The provider key and webhook secret are wired as `EMAIL_API_KEY` was.

Size: L, six or seven agent tickets, one map, one design pass.

### 9. Analytics growth

- Advanced analytics. Embedded order status events supply status timestamps for new events; orders
  without history expose only a synthetic Pending event at creation time, and payment changes have
  no event history ([ADR 0015](adr/0015-order-status-events-are-embedded-in-orders.md)).
- Custom date ranges and charts. Decide a date picker and a chart library once the preset numbers
  prove useful.

Triggered, not scheduled: revenue is only real after group 8 and stock reports need group 5. Size:
S to M, about three tickets.

## Session briefs

The human sessions for the next groups, written out so they can start cold.

### Group 4: open the wayfinder map

Copy this prompt into a fresh session:

```text
Use the mattpocock-skills:wayfinder skill to chart
group 4 of docs/ROADMAP.md: Catalogue growth — uploads, product creation and
categories. Group 3 is complete; group 4 is next.

Destination: a specced implementation parent issue for dashboard image uploads,
product creation and an arrival-date rule, with the variant strategy decided and
runtime category management either included by an explicit product decision or
parked with its reason. This session charts the decision map; the implementation
parent is the destination of the map, not something to spec before its decisions.

Start by reading AGENTS.md, the roadmap's workflow, inherited constraints, group 4
block and closing re-triage checklist. Use docs/agents/issue-tracker.md for GitHub
map operations. Follow the relevant guides for each investigation: packages/media/
README.md for image ownership/publication, packages/database/README.md and ADR 0007
for catalogue persistence, docs/agents/domain.md for contracts, apps/server/README.md
for uploads/validation, apps/client/README.md for admin UI, docs/deployment.md for
secrets, and apps/e2e/README.md for fixtures. Check current code before treating a
roadmap statement as a fact. Reuse an existing group 4 map if one already exists.

Use the mattpocock-skills:grilling and mattpocock-skills:domain-modeling skills to confirm the destination and map the open
decisions breadth-first. Keep these choices open for their decision sessions:

- What does an admin provide for each image role: the existing breakpoint crops,
  or one original with derived sizes? How are cropping, preview and replacement
  handled in the product-creation flow?
- Where are sizes and WebP/AVIF variants produced: a media-package job, sharp in
  the container, or Cloudflare Image Transformations? Research current limits,
  supported formats, cost and implications for existing and uploaded images.
- Does upload use a browser presigned PUT to R2 or multipart through Express?
  Research authorization, size/type validation, CORS, key ownership, incomplete
  uploads and cleanup. Account for the current request-size limit and deployment.
- Are runtime categories wanted? If yes, decide their names/slugs, thumbnails and
  management flow; if no, park category management and the enum replacement with
  the reason. Use a human grilling session for this product choice.

Create a group-scoped wayfinder map and the decision tickets precise enough to
write now, with native blocking edges. Use research tickets for provider/API facts,
a prototype ticket for the upload and creation UI, grilling for product semantics,
and task tickets only for prerequisites that unblock a decision. Follow wayfinder's
research dispatch and charting stop rules; human decisions stay with the human.

Carry unresolved questions in the map's fog until they can become concrete tickets:
the arrival-date meaning and isNewProduct rule, the migration pattern for catalogue
fields after ADR 0007, and group 6's future attributes needs. Keep implementation of
groups 5–9 outside this map. Preserve these constraints while exploring:

- Dashboard uploads must survive media:sync --prune; decide how to scope or retire
  that operation before the first upload slice ships.
- Existing catalogue documents need optional fields or an explicit backfill;
  db:sync does not update them. Keep destructive setup/seed operations local.
- Bucket validation must preserve the dedicated E2E product-creation path.
- Identify human provisioning for R2 credentials and any bucket CORS changes;
  agents wire approved secrets through the documented deployment path.
- The UI prototype uses the shared centred dialog and covers the phone layout.

When the map's decisions are resolved in later sessions, hand off a parent issue,
slices and closing re-triage in the shapes docs/agents/roadmap-group.md holds. Its
standing block carries the per-slice rules; copy it rather than restating them.

For this charting session, finish with links to the map and named decision tickets,
the unblocked frontier, research status and the next human session to run. Keep
production implementation and batch shipping for the later handoff.
```

## Parked

- Social authentication. No trigger and it unblocks nothing. Needs a provider decision, an OAuth
  callback through the Worker to the container, and an account-linking policy for existing email
  accounts. If it comes, it is a small group of its own, as buttons in the form column
  of the auth layout [#356](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/356) built
  (`apps/client/src/components/layouts/auth-layout.tsx`).
- Hard user delete from the UI. Deactivation already is the soft delete ([glossary](../GLOSSARY.md),
  **User**), and the user-to-order cascade means a hard delete erases order history. The only driver
  is a legal erasure request, which wants anonymisation that keeps orders and scrubs personal data,
  not a delete button. [#345](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/345)
  removed the API path; `DELETE /users/deleteMe`, which deactivates, is the only self-service path
  left ([ADR 0010](adr/0010-nothing-an-order-references-is-hard-deleted.md)).
- Switching the email provider to Cloudflare Email Sending. Not reopened at its general
  availability: Resend is free at this volume and the switch would buy nothing. The
  [email provider note](research/email-provider.md) records what Cloudflare would need to offer,
  for the record, not as a plan.
- Skeleton loaders in the storefront. Rejected in
  [#359](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/359), the second time with the
  skeletons rebuilt to the real pages: the old page under the progress bar is the loading state
  ([ADR 0013](adr/0013-a-storefront-navigation-keeps-the-old-page-under-a-progress-bar.md)).
  `ui/skeleton.tsx` stays for the admin pages.
- Further resource preloads. The hero preload
  [#361](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/361) measured moved the request
  from the `img` to the preload `link` and left LCP at 108 ms
  ([ADR 0013](adr/0013-a-storefront-navigation-keeps-the-old-page-under-a-progress-bar.md));
  another preload waits for a measurement that shows a gain.
- Swipe-to-dismiss on the mini-cart. It left with `vaul` in
  [#362](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/362)
  ([ADR 0014](adr/0014-every-dialog-is-one-radix-primitive-with-a-placement.md)); no trigger
  to bring it back.
- Dark mode and multi-language support. Not planned.

## Removed in the #162 triage

Items dropped as done, duplicated or won't-do are listed in the closing comment on
[#162](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/162).
