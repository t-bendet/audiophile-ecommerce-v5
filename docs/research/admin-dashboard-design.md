# Admin dashboard design note

Decided 2026-11-01 in the prototype session for [#320](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/320).
This is the document #322 to #326 follow for anything visual. The prototype itself is the primary
source: branch
[`prototype/320-admin-dashboard-design`](https://github.com/t-bendet/audiophile-ecommerce-v5/tree/prototype/320-admin-dashboard-design),
route `/prototype/admin`, run with `pnpm dev:client`. It is throwaway code and is never merged.

## Verdict

**Variant B, the storefront-branded dashboard, as prototyped.** Nothing is taken from the other
two. Rejected: **A**, shadcn `dashboard-01` adopted wholesale (neutral palette, offcanvas sidebar,
chart card, tables that scroll on a phone); **C**, a top navigation shell with dense borderless
ledger rows, filters in a side panel and selects inline in the detail title row.

## Block or primitives

**Assemble from primitives.** No shadcn block is adopted, whole or shell only. The shell is a
hand-built sidebar and header; the `sidebar`, `sheet`, `breadcrumb` and `chart` pieces and the
`recharts` and `@tabler/icons-react` dependencies the block brings stay out. Icons are `lucide-react`,
as everywhere else in the client.

## Decisions

### Relationship to the storefront

Same brand. Manrope throughout, the storefront's uppercase tracked overlines (`text-xs font-bold tracking-600 uppercase`)
for section titles, column headers and field labels, the `primary-500` orange as the only accent,
`neutral-900` for the sidebar, `neutral-200` for the page background and white panels on it.
Light only; dark mode arrives with the roadmap item, not here. Rejected: A's neutral admin palette.

### Navigation shell

A fixed left sidebar, 15rem wide, `neutral-900` with `neutral-100` text. The storefront logo sits
at the top, an "Admin" overline below it, then one entry per section (Orders, Users, Products,
Homepage, Stats) as uppercase overlines with a lucide icon; the active entry is orange with a
1-unit orange bar on the sidebar's left edge. The sidebar footer shows the admin's name and email
and a "Storefront" link back to `/`. The content column has a 5rem white header with the page
title in `text-2xl font-bold uppercase` and, on detail pages, a small overline link back to the
parent list above it.

Below the `md` breakpoint the sidebar is replaced by a fixed 4rem bottom tab bar on `neutral-900`
with the five entries as icon plus 10px label, active in orange; the header gains the logo. There
is no drawer. Rejected: A's offcanvas sidebar that opens as a Sheet on a phone, C's top tab strip.

### List pages

Comfortable density: 4rem rows, overline column headers, 1.5rem horizontal cell padding, the table
in a white rounded panel. Filters sit in a white toolbar panel above the table: a labelled search
input that grows, labelled selects, and an orange "Apply" button. Pagination is a row under the
table with "Showing 1–10 of N" on the left and outline "Prev" and "Next" buttons on the right.

Below `md` the table is not rendered; rows become stacked white cards. An order card shows the
short id and date on one line, the customer email, then the two status pills left and the total
right. A user card shows name and email with the active pill on the right; role is dropped on a
phone. Rejected: A's horizontally scrolling table and column-visibility menu, C's reflowing ledger
rows and side-panel filters.

### Status language

One pill component for order status and payment status, used identically in the list, the detail
page and the stats breakdown: a filled rounded-full pill, 10px uppercase bold with `tracking-300`.
Colours: Pending `neutral-200`/`neutral-500`; Processing `primary-400/30`/`primary-500`; Shipped
`sky-100`/`sky-700`; Delivered and Paid `emerald-100`/`emerald-700`; Cancelled and Failed
`primary-700/10`/`primary-700`; Refunded `amber-100`/`amber-700`. Role uses the same pill, `neutral-900`
filled for ADMIN and `neutral-200` for USER; active state uses the Delivered and Cancelled colours.
Rejected: A's outline badge with an icon, C's coloured dot and plain text.

### Detail and edit pages

**Order detail** is two columns on `lg`: the summary left (items with thumbnail, cart label, price
and quantity; totals with the grand total in orange; then three panels for customer, ships-to and
billed-to), and a sticky "Fulfilment" panel right that holds the current pills, the order status
select labelled "Move order to", the payment select, a full-width orange Save button disabled until
something changed, and a one-line note that payment status is set by hand. Each select offers the
current value plus the transitions the domain tables allow. Choosing Cancelled on a Paid order shows
an orange-tinted note that a refund may be due. Below `lg` the Fulfilment panel comes first.
Rejected: C's single column with the selects in the title row.

**Product edit** is two columns on `lg`. Left, in order: "Basics" (name, price in dollars with the
cents hint, category select, new-product checkbox), "Copy" (description, features), "In the box"
(one row per included item: an orange `Nx` indicator, a quantity input, the item input and a trash
link button; an outline "Add" button in the panel header), "Labels" (cart, short, full). Right, sticky:
"Publish" with the orange Save button, and "Read only" with the slug as a grey monospace chip and the
three images as greyed thumbnails captioned thumbnail, featured, showcase, with a note that images are
published from `packages/media`.

**User detail** is an "Account" panel left (name, email, role pill, status, joined, and an outline
"Deactivate account" button that opens the existing dialog primitive with "Keep active" and an orange
"Deactivate") and an "Orders (N)" panel right listing the user's orders as rows with pills and total.
The signed-in admin's own page omits the button.

### Homepage slot picker

Four image cards, one per slot, in a row on `xl` and two per row on `md`. Each card shows the slot
name as an overline over the product thumbnail on a `neutral-200` background (the featured slot on
`primary-500`), the product name below, and an outline "Change" button that is replaced in place by
the slot's select. The select lists only products carrying the image the slot renders and disables
a product chosen in another slot. A white bar under the cards holds the explanation and the orange
"Save homepage" button. Rejected: A's four selects in a row, C's four list rows.

### Stats

The period is the existing tabs primitive, top right, with the active tab `neutral-900` on white.
Three stat cards (Orders, Revenue, New customers) in a row, each a white panel with a 4rem orange bar
on its top edge, an overline label and a `text-4xl font-bold` number. Below them, two panels side by
side: "Orders by status" (a pill per status with the count right) and "Best sellers" (rank in orange,
thumbnail, uppercase name, "N sold"; each row links to the admin product page). No chart. Rejected:
A's chart card and trend badges, C's scoreboard strip.

### States

Empty list: a white panel with the overline "Nothing here yet", one sentence of guidance and an
orange "Clear filters" button. Loading: the existing `Skeleton` primitive, five white card rows of
rounded-full bars on `neutral-200`; detail pages use two panel-sized skeletons. Error: the existing
`ErrorBlock` inline where the list would be, per the client guide. Rejected: C's spinner.

## Primitives and dependencies

Beyond `table`, `select` and `badge`, the design needs nothing new from the registry except
`textarea` and `checkbox` for the product form (#325). Pagination needs no primitive: it is two
existing `Button`s and a label. `dialog`, `input`, `label`, `tabs`, `skeleton` and `tooltip` already
exist. The status pill is `badge` with the variants above added in `components/ui/badge.tsx`, so the
slice that adds badge (#323) defines them.

| Slice | Adds via `shadcn add`      |
| ----- | -------------------------- |
| #323  | `table`, `select`, `badge` |
| #325  | `textarea`, `checkbox`     |

The current registry emits these with `import { ... } from "radix-ui"` (the umbrella package) and
adds it to `package.json`; that is fine. Two CLI quirks to correct by hand after every `shadcn add`:
it resolves this project's `@/lib/cn` alias to a bogus `cn` npm package (rewrite the import, remove
the dependency), and it may add `next-themes` for the already-present `sonner` (remove it).

## Findings from the prototype

- The storefront `<body>` defaults to white text. The admin layout must set its own foreground
  (`text-neutral-900`) on its root.
- The storefront's `Button` is uppercase and tracked by default and has no `ghost` variant, and its
  `Card` has no `CardAction`. B uses the existing `Button` variants (`accent`, `outline`, `link`) and
  plain `section` panels instead of `Card`, so nothing changes in those primitives.
- Stock registry files for `badge`, `sidebar`, `toggle` and the `use-mobile` hook trip this repo's
  lint rules (`react-refresh/only-export-components`, `react-hooks/set-state-in-effect`,
  `react-hooks/purity`). The `badge` file exports `badgeVariants` beside the component. The client's
  `react-refresh/only-export-components` rule allows only literal constants beside a component
  (`allowConstantExport`), not a `cva()` result, and client lint runs with `--max-warnings 0`, so
  that export fails lint. `button.tsx` keeps `buttonVariants` module-private and exports only the
  component; do the same for `badgeVariants`. Consumers use `<Badge variant="...">`.
- `thumbnail.jpg` under the product's media prefix is the right image for every admin surface; no
  new image sizes are needed.
