# Account area and order detail prototype (group 3)

Three account shells, three order detail layouts, two profile pages and two security pages, on
the real `/account/*` routes plus a new nested `/account/orders/:orderId`, switchable from the
floating bar. Group 3 has no parent issue yet, so the marker is `PROTOTYPE (#0)`.

## Run

Start the local API and the Vite client (`pnpm dev`), sign in as `doe@example.com` /
`11111111`, and open <http://localhost:5173/account/orders>. The seeded shopper has four orders
in this session's database: one Shipped and Paid, one Delivered and Paid, one Pending and one
Cancelled. Read choices with `useProto()`; the bar updates the URL without rerunning loaders.

| Bar row  | Keys                                         | What it changes                                                                                                                            |
| -------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| shell    | A / B / C, ← / →                             | A: storefront title, underline tabs. B: sidebar card and nav (pill row on a phone). C: dark band with the greeting and pill nav             |
| detail   | A / B / C                                    | A: receipt, horizontal stepper, tracking panel, items, addresses. B: items left, sticky status rail with a vertical timeline. C: tracker hero, newest-first history, items and addresses folded |
| profile  | A / B                                        | A: inline name and email form. B: hub with a details card, an edit dialog, recent orders and a security link                                |
| security | A / B                                        | A: change-password section then a deactivate section; the dialog asks for the password. B: two cards opening dialogs; deactivate asks for a typed word |
| status   | real / pending / shipped / delivered / cancelled | The timeline's status; `real` reads the order's own. History, tracking and carrier are synthesised from `createdAt` (`timeline.ts`)     |
| actor    | hidden / shown                               | Whether each event names who did it: You, Audiophile or Carrier update                                                                      |
| link     | heading / button                             | How an order card reaches its detail page: the heading is the link, or a "View order" button in the footer                                  |
| role     | shopper / sole-admin                         | sole-admin shows the deactivate refusal in place of the button                                                                              |

Nothing here writes: the profile, password and deactivate saves are stubs that show the toast and,
for deactivation, go home. The order detail reads the real `GET /orders/:orderId`.

Run `node apps/client/src/components/prototype/account-orders/shots.mjs [filter] [origin]`
for the screenshot matrix; the filter is a substring of the capture stem, which includes every
axis and toggle value, so one row's comparison is one filter. Screenshots go to
`.scratch/prototype-shots/account-orders/`.

Throwaway code on the `prototype/group-3-account-and-order-detail` branch, never merged; the
verdict goes in `docs/research/account-and-order-detail-design.md`.
