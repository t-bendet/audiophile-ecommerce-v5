# Admin dashboard prototype (#320)

Three variants of the admin dashboard on one throwaway route, `/prototype/admin`,
switchable via `?variant=A|B|C`. Each variant renders every page the slices #322 to #326
describe (`?page=stats|orders|order|users|user|products|product|homepage`) and every
list state (`?state=data|empty|loading|error`). Data is in-memory fixtures; saves only toast.

Run `pnpm dev:client` and open <http://localhost:5173/prototype/admin>. No server needed.

| Variant | Question it answers                                                                                  |
| ------- | ---------------------------------------------------------------------------------------------------- |
| A       | Adopt shadcn `dashboard-01` wholesale: its sidebar, header, stat cards, chart card, neutral palette. |
| B       | Storefront brand: dark sidebar, orange accent, Manrope overlines, cards; bottom bar on a phone.      |
| C       | Deliberately different: top navigation, dense borderless ledger rows, filters in a side panel.       |

Throwaway code. It lives on the `prototype/320-admin-dashboard-design` branch and is never
merged to `main`; the verdict goes in `docs/research/admin-dashboard-design.md`.
