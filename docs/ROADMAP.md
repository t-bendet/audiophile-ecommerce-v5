# Roadmap

Planned and candidate features, grouped in the order they will be built. Items here are intent,
not specced work: a group becomes GitHub issues when its turn comes, following the
[issue workflow](agents/issue-tracker.md). Dark mode and multi-language support are not planned.

The grouping was drawn up on 2026-11-02 against the code at that date; the facts quoted in each
group were checked then. Groups 0 to 4 are ordered with intent. The order of groups 5 to 9 is
provisional and is reconsidered at every group boundary.

## How the roadmap is worked

**One group at a time.** A group becomes a parent issue in the shape of
[#319](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/319): a "decisions that shape
every slice" section and one sub-issue per vertical slice, linked with native blocking edges. The
parent issue is where the group's decisions live; this file names the questions, never the answers.
A slice's PR removes its item line here; the group's last sub-issue, the closing re-triage, removes
the group block.

**Pick the entry skill by how many decisions the group has open.**

- No open decision (group 0): write the issues directly from this file. Run
  [roadmap-batch](../.agents/skills/roadmap-batch/SKILL.md) only when they should also be shipped in
  the same session; it hands the queue to batch-tickets.
- One decision or one design pass (groups 1, 2, 3, 7): write the parent issue first, then run
  [to-tickets](../.agents/skills/to-tickets/SKILL.md) against it so the human session becomes its
  first sub-issue, labelled `ready-for-human`, and the agent slices are specced in the same pass,
  as [#319](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/319) was with its design
  pass #320. The human ticket runs the matching skill:
  [research](../.agents/skills/research/SKILL.md) for a provider comparison,
  [prototype](../.agents/skills/prototype/SKILL.md) for a UI question,
  [grilling](../.agents/skills/grilling/SKILL.md) for semantics. Its close amends the slices the
  decision changed; then the slice numbers go to
  [batch-tickets](../.agents/skills/batch-tickets/SKILL.md), or the parent number alone, which it
  resolves to the open sub-issues in blocking order.
- Several interlocking decisions of different kinds (groups 4, 5, 6, 8): open a
  [wayfinder](../.agents/skills/wayfinder/SKILL.md) map for that group only. Group 4 is the model
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
- The first slice of a group that introduces a new seam (an email transport, an upload path, a
  payment webhook) stops at PR open for a hand review; the rest of the batch auto-merges on green.
- Group-scoped decisions live in the parent issue and its comments. Durable ones become ADRs, as the
  catalogue ownership change did in
  [ADR 0007](adr/0007-the-database-owns-the-catalogue-after-first-publish.md). When a batch shows an
  assumption was wrong: stop the batch, update the parent issue, re-spec only the slices still open.
- Every group ends with a closing re-triage ticket, blocked by every other slice, so the batch cannot
  finish without it. Its PR closes the parent and stops at PR open for review. It removes the closed
  group's block, carries every decision the group settled back into this file and the ADRs, reads
  every remaining group against what shipped, and states whether the remaining order holds. The
  checklist under "Closing re-triage" is its acceptance criteria.
- Every slice ships its own E2E. The test suite is not an epic of its own; group 0 clears the known
  gaps once.

**Constraints every group inherits.**

- [ADR 0007](adr/0007-the-database-owns-the-catalogue-after-first-publish.md): `db:sync` no longer
  updates existing documents, so every new catalogue field (arrival date, archived, stock,
  attributes, rating aggregates) needs a backfill or must be optional; Prisma on MongoDB fails a read
  when a required field is missing from a document. The first group to add one establishes the
  migration pattern and records it as an ADR.
- Every external provider (email, R2 write access, a payment gateway) is a Worker secret, the
  Worker's env forwarding and the server env schema, as the [deployment runbook](deployment.md)
  describes. A human provisions; an agent wires.
- Test doubles for email and payments switch on `NODE_ENV=test` only, never on a second variable.
- `media:sync --prune` deletes any bucket key the repo does not have. The first dashboard upload
  makes it destructive, so the upload slice scopes or retires it.

**Closing re-triage.** The checklist each group's last sub-issue carries; the first one is
[#347](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/347).

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

### 0. Debt sprint

Agent-only. Filed as [#340](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/340) with
six sub-issues; the last, [#347](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/347), is
the closing re-triage.

- A complete test suite, read as the known E2E gaps: admin order filters and pagination and the
  cancel path, product edit beyond price, a homepage slot save, the other stats periods, and a
  mobile viewport project.
- Role changes from the user management UI, with a self-demotion guard and a last-admin guard.
  Promotion and demotion are the `db:role` script until it lands.
- Retire the admin hard user delete and refuse product delete cleanly. Added in this triage: the
  user delete cascades the user's orders and contradicts the glossary, and deleting a referenced
  product fails with an unmapped database error.

Depends on nothing. Size: S, five tickets. Runs while the human sessions for groups 1 and 2 happen.

### 1. Email foundation and account recovery

- Forgot password and reset flow. The `User` model already has `passwordResetToken` /
  `passwordResetExpires`; the forgot and reset routes sit commented out in the auth router and a
  reset rate limiter is defined but not mounted; there are no reset schemas in the domain package
  and no email code anywhere. The "Forgot your password?" link in `login-form.tsx` is a dead
  `href="#"` until this lands.
- Order confirmation emails. The confirmation page already says one is sent; nothing sends it. Its
  "we charged" copy is wrong for cash on delivery and is fixed here.
- Auth layout visuals. The layout is a bare muted background with a form card; it gains two reset
  pages in this group.

Why first: the two visible promises the site does not keep, and the smallest group with an external
dependency. Depends on: the email provider decision. Unblocks: status notifications in group 3 and
anything else that sends mail.

Human first: the email provider (an HTTP-API provider rather than SMTP out of the container), the
sending domain's DNS records, the secret, and a design pass on the auth layout. Brief under
"Session briefs" below.

Agent-decidable with guidance: a transport that becomes an in-memory outbox under `NODE_ENV=test`,
readable by route tests and E2E; a hashed reset token at rest; the existing reset limiter mounted;
the confirmation sent at checkout as "order received", since payment is still set by hand.

Size: M, four or five agent tickets and one design pass.

### 2. Storefront loading states and dialogs

- Skeleton loaders for images and sections. `ui/skeleton.tsx` is used on every admin page;
  `product-skeleton.tsx` and `products-list-skeleton.tsx` are dead code. The storefront shows
  spinners: there is no navigation pending UI and no route-level Suspense boundary, the home loader
  prefetches without awaiting so the hero always spins, and the signed-in dropdown renders raw
  "Loading..." text.
- Preload critical resources. Fonts have `preconnect` and `rel=preload`; both hero images load
  `eager` with `fetchPriority="high"`. The remaining candidate, `react-dom`'s `preload()` for the
  featured image from the home loader, needs the loader to await the featured query, which is the
  same choice as the skeleton question. Measure before doing more.
- `useSuspense` in `logged-in-user-dropdown.tsx` and React Query stale-time tuning for auth.
  Performance items with no trigger; decided in the same prototype session because the dropdown's
  loading state is in scope.
- Dialog component variants for cart, thank-you and navigation. Three mechanisms today: a Radix
  dialog with heavy overrides for the mobile menu, including a leftover placeholder description and
  an `aria-describedby` that points at nothing; a vaul drawer for the mini-cart; inline page content
  for the thank-you. The shared dialog overlay hardcodes the storefront nav offset, which admin
  inherits.

Why second: client-only, no external dependency, and it settles the route-level loading pattern
that order detail, wishlist and search results build on later.

Human first: the prototype session the skeleton item already asks for, extended to the
await-versus-stream choice per route and to one dialog primitive with variants. Brief under
"Session briefs" below.

Size: S to M, three or four agent tickets and one prototype session.

### 3. Order tracking, history and notifications

- Order tracking: status updates visible to the shopper, tracking numbers, notifications. There is
  no shopper order detail route (the query hooks exist, unused); the order card shows a status line;
  `Order` has no tracking number.
- Order status history and audit trail (who changed what, when). No history exists. The status
  update is read-then-write with no guard on the current status, so adding the event record is the
  moment to make the transition atomic.
- Customer notifications on order status change. Sent from the code that writes the history entry,
  through group 1's transport.

Depends on: group 1 for the notification slice only; the rest can start earlier. Unblocks: the
delivered-purchase check for reviews (group 7), the gateway's event trail (group 8), status timings
in analytics (group 9).

Human first: a short design pass for the shopper's order detail page and timeline. The account
area's profile and security pages are placeholder cards today, so this pass sets the account area's
pattern. Agent default unless overruled: tracking number and carrier as free text, captured at the
Shipped transition. Give the event an actor that can be a user or "system" so group 8's webhooks
reuse it.

Size: M, four or five agent tickets and one short design pass.

### 4. Catalogue growth: uploads, product creation, categories

- Image uploads from the admin dashboard. Images are files in `packages/media`, published to R2 by
  `pnpm --filter @repo/media media:sync` with developer credentials through the S3 SDK; the server
  has no R2 credential. The global JSON body limit is 10 kB. A full product is seven image roles
  with three hand-cut crops each, so a naive upload form means around twenty files per product. The
  domain's image key pattern already accepts `webp` and `avif`.
- Product creation from the dashboard. The server's admin create endpoint exists and is unused. A
  new product needs image keys that exist in the bucket, which is why this waits on uploads
  ([ADR 0007](adr/0007-the-database-owns-the-catalogue-after-first-publish.md)).
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

Why fourth: the longest pole with the most human decisions, so its map opens while groups 1 to 3
run. Nothing downstream (filter, search, archive, inventory) is worth much on a six-product
catalogue. Unblocks: groups 5 and 6 in practice.

Human first, as a wayfinder map: what an admin uploads per product (per-role-per-breakpoint crops as
today, or one original per role with derived sizes); if derived, where (sharp in the container or
Cloudflare Image Transformations); the upload path (presigned PUT from the browser or multipart
through Express); whether runtime categories are wanted at all. If categories stay fixed, category
management and the enum replacement park here with that reason. Provisioning: an R2 token as a
Worker secret, bucket CORS if presigned. Then a design pass for the upload UI.

Size: L, six to eight agent tickets, one map, one design pass.

### 5. Product lifecycle: archive, inventory, availability

- Product delete or archive. Cart items cascade on product delete and silently vanish; order items
  and homepage slots declare no rule, so Prisma refuses the delete. Archive is still the answer:
  order lines read the product's name and image live, so an ordered product can never be removed.
  Needs an "unavailable" or "archived" state.
- Inventory management. No stock field exists. Checkout creates the order and empties the cart in
  one transaction with no stock check; that transaction is where a decrement with an oversell guard
  goes.
- The availability flag that group 6's filter consumes. Slots, related products and the sitemap
  must exclude archived products.

Depends on: group 4's migration pattern, and a catalogue to manage. Swap it ahead of group 4 if the
upload decisions stall. Unblocks: the availability filter, a safe delete button, hiding archived
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

Depends on: groups 4 and 5. Human first: the search technology (a MongoDB text index runs on the
local replica set and in route tests; Atlas Search has autocomplete and highlighting but changes the
test seam), whether features become attributes, and a design pass for the filter bar and the nav
search box, which the storefront design does not have. Recommendation at triage time: a text index
with prefix matching and client-side highlighting until the catalogue is hundreds of products.

Size: M, four or five agent tickets and one design pass.

### 7. Shopper engagement: wishlist and reviews

- Wishlist. Nothing exists; login-only would match checkout, guest-capable would match the cart.
- Product reviews and ratings. Nothing exists. Eligibility can reuse group 3's Delivered status; a
  rating sort joins group 6 as a follow-up.

Depends on: groups 3 and 5. Swappable with group 6. Human first: wishlist scope, who may review and
whether admin moderates, and a design pass for the product page sections, the card control and the
account wishlist page.

Size: M to L, five or six agent tickets and one design pass.

### 8. Checkout and payments

- Payment gateway. The payment method is a free string the client sets; Paid and Refunded are set by
  hand. The gateway replaces the manual toggles.
- Coupling between payment status and order status. "Refund requires paid" is already enforced by
  the payment transition table; "cancel implies refund" is not, and arrives with the gateway.
- Checkout enhancement: address book, multiple payment methods. The address book is user-owned
  addresses, an account page, checkout prefill and the missing "same as shipping" toggle; it does
  not need the gateway and can be pulled into group 3's account design pass if wanted sooner.
  Checkout stays login-only; guest checkout is not planned.

Why late: the highest risk and the most human setup, while the manual flow works. For a webhook: a
raw-body route mounted before the global JSON parser; the container is single-instance, sleeps after
ten idle minutes and cold-starts in about four seconds, so lean on the provider's retries.

Depends on: group 3's event actor. Human first, as a wayfinder map: the gateway and integration
style (hosted page or embedded elements), the provider account, test keys and webhook secret, and a
checkout design pass. Test double: a gateway stub under `NODE_ENV=test`.

Size: L, six or seven agent tickets, one map, one design pass.

### 9. Analytics growth

- Advanced analytics.
- Custom date ranges and charts. Decide a date picker and a chart library once the preset numbers
  prove useful.

Triggered, not scheduled: revenue is only real after group 8 and stock reports need group 5. Size:
S to M, about three tickets.

## Session briefs

The human sessions for the next groups, written out so they can start cold.

### Group 1: pick the email provider

Run `/research` in a session on `main` with this brief:

```text
Question: which transactional email provider should Audiophile use for password reset, order
confirmation and, later, order status notifications?

Context: the API is Express in a Cloudflare Container behind a Worker (docs/ARCHITECTURE.md,
docs/deployment.md). Outbound SMTP from the container is unproven; an HTTP API is preferred.
Volume is tiny. The sending domain is t-bendet.com. Secrets are wired in three places per
docs/deployment.md. Tests swap the transport under NODE_ENV=test for an in-memory outbox; no
second toggle.

Compare at least Resend, Postmark, Mailgun and Amazon SES on: free tier and price at low volume,
Node SDK or plain fetch API, domain verification steps (SPF, DKIM, DMARC), sandbox or test mode,
delivery event webhooks, templates versus raw HTML, EU data option.

Deliver docs/research/email-provider.md with a recommendation, the DNS records to add and the
secret names the server will need. Change no other file.
```

Then create the provider account, add the DNS records, run `wrangler secret put` for the key, and
record the choice at the top of the group 1 parent issue when it is written.

The auth layout design pass is a `/prototype` session with the brief: "the auth layout gains a
forgot-password page and a reset-password page; show the layout with the storefront's logo and
imagery, then the two new pages, on mobile and desktop". Its output is a design note beside
[the admin dashboard design note](research/admin-dashboard-design.md).

### Group 2: loading states and dialogs prototype

Run `/prototype` with this brief:

```text
Design question: what should each storefront route show while its data loads, and which one
dialog primitive serves the mobile menu, the mini-cart and the checkout thank-you?

Facts: ui/skeleton.tsx is used on every admin page; product-skeleton.tsx and
products-list-skeleton.tsx are unused. There is no navigation pending UI and no route-level
Suspense boundary; the category, product and account loaders await ensureQueryData, so a click
leaves the old page on screen. The home loader prefetches without awaiting, so the hero always
shows a spinner and its image URL is unknown at loader time, which blocks a react-dom preload()
call. The signed-in dropdown renders the text "Loading...". The mobile menu is a Radix Dialog with
overrides (a leftover placeholder description, an aria-describedby pointing at nothing); the
mini-cart is a vaul Drawer; the thank-you is inline content; the shared Dialog overlay hardcodes
the nav-bar offset that admin inherits.

Decide, per route (home, category, product, account orders, checkout): await in the loader with a
skeleton, or stream with a route-level Suspense fallback; and whether the home loader awaits the
featured query so the hero image can be preloaded. Decide one dialog primitive and its variants
(sheet below the nav, bottom drawer, centred). Note where useSuspense in the dropdown and the
auth stale-time change as a result.

Throwaway code only. Deliver a design note beside docs/research/admin-dashboard-design.md with the
decisions and screenshots; the group 2 parent issue copies the decisions.
```

### Group 4: open the wayfinder map

When groups 1 to 3 are moving, run `/wayfinder` with the destination "a specced parent issue for
catalogue growth: dashboard image upload, product creation, category management and the arrival
date, with the variant strategy decided". Seed its tickets from the four questions in the group 4
block: research for Cloudflare Image Transformations limits and R2 presigned uploads, prototype for
what the admin uploads per product, grilling for runtime categories. Put the migration pattern for
new catalogue fields and group 6's attributes question in its fog.

## Parked

- Social authentication. No trigger and it unblocks nothing. Needs a provider decision, an OAuth
  callback through the Worker to the container, and an account-linking policy for existing email
  accounts. If it comes, it is a small group after group 1, as buttons on the new auth layout.
- Hard user delete from the UI. Deactivation already is the soft delete ([glossary](../GLOSSARY.md),
  **User**), and the user-to-order cascade means a hard delete erases order history. The only driver
  is a legal erasure request, which wants anonymisation that keeps orders and scrubs personal data,
  not a delete button. Group 0 removes the API path meanwhile.
- Dark mode and multi-language support. Not planned.

## Removed in the #162 triage

Items dropped as done, duplicated or won't-do are listed in the closing comment on
[#162](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/162).
