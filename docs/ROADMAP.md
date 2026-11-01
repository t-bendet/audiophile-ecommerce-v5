# Roadmap

Planned and candidate features. Items here are intent, not specced work: when one is ready to build, it becomes a GitHub issue. See the [issue workflow](agents/issue-tracker.md).

## Features

A complete test suite

Product features, none of them specced yet:

- Forgot password & reset flow. The `User` model already has `passwordResetToken` / `passwordResetExpires`; needs an email provider decision. The "Forgot your password?" link in `login-form.tsx` is a dead `href="#"` until this lands.
- Order confirmation emails (shares the email infrastructure above).
- Admin dashboard: product CRUD, order fulfilment, user management, analytics. See "Blocked on the admin dashboard" below.
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

- Auth through React Router middleware and a typed context. Today auth is re-checked in four route loaders plus a `getIsAuthenticated` helper in `features/cart/api/get-cart.ts`. Folds in the central queryClient/auth hook, `useSuspense` in `logged-in-user-dropdown.tsx`, and React Query stale-time tuning for auth. Middleware already runs: React Router v8 removed the `v8_middleware` flag, and `performanceMiddleware` logs on every navigation. Real middleware reads `({ context }, next)` with `createContext()` keys and `context.get()`/`context.set()`. `performanceMiddleware` times the whole data-strategy run, loader retries included.
- Skeleton loaders for images and sections. Run a prototype session first to find where a loading state is missing, then ticket the result. `ui/skeleton.tsx`, `product-skeleton.tsx` and `products-list-skeleton.tsx` already exist.
- WebP or AVIF variants. Now a media package job: generate them beside the originals, put them in the manifest and publish them with the rest; `ResponsivePicture` already carries the breakpoint sources and would only consume them. #189 left it out of scope with no trigger yet.
- Preload critical resources. Fonts already have `preconnect` and `rel=preload`; both hero images already load `eager` with `fetchPriority="high"`. Measure before doing more; the remaining candidate is `react-dom`'s `preload()` for the featured image from the home loader.
- Auth layout visuals.

## Blocked on the admin dashboard

- Replace the `NAME` enum on `Category` with `name: String` + `slug: String @unique`. Touches the Prisma enum, the domain Zod schemas, the `/products/category/:category` route param, `config/paths.ts`, the category route and `seo/metadata.tsx`. Only pays off once categories are created at runtime.
- `isNewProduct` as a value derived from an arrival date. No such date exists today (only `createdAt`, which is seed time); needs a new field plus a rule such as "less than a year old". Until then the manual flag stays.
- Image uploads from the dashboard. Images are files in `packages/media` today, published to R2 by `pnpm --filter @repo/media media:sync`; a dashboard upload would have to write to the bucket and to the catalogue's storage keys in one step.

## Removed in the #162 triage

Items dropped as done, duplicated or won't-do are listed in the closing comment on [#162](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/162).
