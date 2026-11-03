# Every dialog is one Radix primitive with a placement

Every dialog in the client renders `ui/dialog.tsx`, one primitive on `@radix-ui/react-dialog`.
`DialogContent` takes a required `placement`, one of exactly the three in use: `sheet-top` (the
mobile menu, full width from under the nav), `sheet-top-end` (the mini-cart, a `max-w-sm` panel
1.5rem under the nav at the container's right edge) and `centred` (the checkout thank-you and the
admin account confirmations). It takes a required `title`, always rendered so every dialog has an
accessible name and hidden with `srOnlyTitle`; an optional `description`, the only way a dialog
gets an `aria-describedby`, which is otherwise forced to `undefined`; and `closeButton`. The
overlay is `bg-neutral-900/50` over the whole viewport and carries `data-testid="dialog-overlay"`,
the client's only test id. The storefront nav offset is the opt-in `belowNav` prop, set by the
menu and the mini-cart only, which starts the overlay and the sheets under `--nav-bar-height`.
`ui/drawer` and `vaul` were removed. The checkout thank-you is a `centred` dialog mounted
`defaultOpen` over the checkout page: the order empties the cart, so the page under it settles on
the empty state, and a click outside is prevented so a stray tap cannot drop the shopper there;
Escape goes home. Settled in [#359](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/359)
([design note](../research/storefront-loading-and-dialogs-design.md)) for
[#358](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/358) and built in
[#362](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/362); the client guide's
[Dialogs](../../apps/client/README.md#dialogs) section has the table.

## Considered options

Keeping three mechanisms was rejected: a Radix dialog with overrides for the menu, carrying a
leftover placeholder description and an `aria-describedby="main-menu"` that pointed at nothing; a
`vaul` drawer for the mini-cart; inline content for the thank-you. The shared overlay hardcoded
`top-(--nav-bar-height)`, which the admin inherited, leaving an 88 or 96 px strip uncovered over
its confirmations.

Bottom drawers with a drag handle, with the mini-cart and the thank-you centred from `md` up, and
side panels from the start and end edges with a full-screen thank-you were rejected in the
prototype for the sheets below the nav.

The design note's "the total" in the mini-cart was not taken as a new label: the mini-cart keeps
its "Subtotal" line, which the mini-cart quantity specs read.

## Consequences

Any new dialog passes a `placement` and a `title`; a fourth placement is a change to the primitive,
not an override at a call site. Admin confirmations now dim the whole shell, sidebar included. The
thank-you heading is Radix's `h2`, and the checkout `<title>` reads "Order Confirmed" while it is
open. The phone specs pin the menu sheet and the overlay at `top: 88px` and the mini-cart panel at
`112px` on the Pixel 7 profile, so a nav-height change touches
`apps/e2e/tests/mobile/storefront.spec.ts`. The phone accessible names stay: "Open main menu" and
the "Main menu" dialog, "Open cart" and the "cart (n)" dialog. `apps/e2e/tests/mini-cart/focus.spec.ts`
asserts that focus moves into the mini-cart, that the page behind it leaves the accessibility tree
without a blocked `aria-hidden` warning, and that Escape returns focus to the cart button. The
mini-cart has no swipe-to-dismiss.
