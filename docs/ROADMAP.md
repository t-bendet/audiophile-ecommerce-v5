# Roadmap

Planned and candidate features. Items here are intent, not specced work: when one is ready to build, it becomes a GitHub issue. See the [issue workflow](agents/issue-tracker.md).

## Features

A complete test suite

Product features, none of them specced yet:

- Forgot password & reset flow. The `User` model already has `passwordResetToken` / `passwordResetExpires`; needs an email provider decision. The "Forgot your password?" link in `login-form.tsx` is a dead `href="#"` until this lands.
- Order confirmation emails (shares the email infrastructure above).
- Admin dashboard: specced and tracked in #319 (order fulfilment, user management, product edit and homepage config, analytics). What it deliberately leaves out is under "Deferred from the admin dashboard" below.
- Advanced product filtering: price range, features, availability.
- Product search: full-text, autocomplete, highlighting.
- Product reviews & ratings.
- Wishlist.
- Checkout enhancement: address book, multiple payment methods. (Checkout stays login-only; guest checkout is not planned.)
- Order tracking: status updates, notifications, tracking numbers.
- Dark mode.
- Multi-language support.
- Social authentication.
- Payment gateway.
- Inventory management.
- Advanced analytics.
- Dialog component variants for cart, thank-you and navigation.

Client work that needs a design or UX pass before it can be specced (from the #162 triage):

- Auth through React Router middleware and a typed context: specced as #321, the first admin dashboard slice. It replaces the four loader re-checks and `getIsAuthenticated` in `features/cart/api/get-cart.ts`. `useSuspense` in `logged-in-user-dropdown.tsx` and React Query stale-time tuning for auth stay here as performance items with no trigger yet. Middleware already runs: React Router v8 removed the `v8_middleware` flag, and `performanceMiddleware` logs on every navigation. Real middleware reads `({ context }, next)` with `createContext()` keys and `context.get()`/`context.set()`. `performanceMiddleware` times the whole data-strategy run, loader retries included.
- Skeleton loaders for images and sections. Run a prototype session first to find where a loading state is missing, then ticket the result. `ui/skeleton.tsx`, `product-skeleton.tsx` and `products-list-skeleton.tsx` already exist.
- WebP or AVIF variants. Now a media package job: generate them beside the originals, put them in the manifest and publish them with the rest; `ResponsivePicture` already carries the breakpoint sources and would only consume them. #189 left it out of scope with no trigger yet.
- Preload critical resources. Fonts already have `preconnect` and `rel=preload`; both hero images already load `eager` with `fetchPriority="high"`. Measure before doing more; the remaining candidate is `react-dom`'s `preload()` for the featured image from the home loader.
- Auth layout visuals.

## Deferred from the admin dashboard

Decided out of scope when the dashboard was specced in #319 (2026-11-01). Each names what unblocks it. [ADR 0007](adr/0007-the-database-owns-the-catalogue-after-first-publish.md) records the catalogue ownership change the dashboard required.

- Product creation from the dashboard. Blocked on image uploads (see the next section): a new product needs image keys that exist in the bucket.
- Product delete or archive. Order items and cart items reference products without a cascade, so a hard delete would dangle them. Needs an "unavailable" or "archived" state, which pairs with inventory management and the availability filter.
- Category management. Three fixed categories are a product decision; category thumbnails are images, so this also waits on uploads. The `NAME` enum replacement stays blocked.
- Role changes from the user management UI. Promotion and demotion are the `db:role` script for now. The UI version needs a self-demotion guard and a last-admin guard.
- Hard user delete from the UI. `User → Order` cascades, so deleting a user erases their order history. Needs soft-delete semantics first.
- Order status history and audit trail (who changed what, when). Design it with order tracking and notifications, which want the same record.
- Customer notifications on order status change. Belongs to the email infrastructure item.
- Coupling between payment status and order status (cancel implies refund, refund requires paid). Arrives with the payment gateway, which also replaces the manual Paid and Refunded toggles.
- Custom date ranges and charts in analytics. Decide a date picker and a chart library once the preset numbers prove useful. Rolls into "Advanced analytics".
- Full-text order search over names and addresses. The admin list filters on order id and customer email only. Part of product search or its own item.
- `useSuspense` in the user dropdown and React Query stale-time tuning for auth. Left out of the middleware refactor; performance items with no trigger yet.

## Blocked on the admin dashboard

- Replace the `NAME` enum on `Category` with `name: String` + `slug: String @unique`. Touches the Prisma enum, the domain Zod schemas, the `/products/category/:category` route param, `config/paths.ts`, the category route and `seo/metadata.tsx`. Only pays off once categories are created at runtime.
- `isNewProduct` as a value derived from an arrival date. No such date exists today (only `createdAt`, which is seed time); needs a new field plus a rule such as "less than a year old". Until then the manual flag stays.
- Image uploads from the dashboard. Images are files in `packages/media` today, published to R2 by `pnpm --filter @repo/media media:sync`; a dashboard upload would have to write to the bucket and to the catalogue's storage keys in one step.

## Removed in the #162 triage

Items dropped as done, duplicated or won't-do are listed in the closing comment on [#162](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/162).
