# Auth layout prototype (#352)

Three variants of the auth layout on one throwaway route, `/prototype/auth`, switchable via
`?variant=A|B|C`. Each variant renders the four auth pages (`?page=login|signup|forgot|reset`)
and the states the client guide asks for (`?state=idle|pending|error|limited|sent|invalid|success`,
the switcher shows only the states a page has). Nothing submits; the reset form's Save jumps to
the success stub, and the login error, rate-limit and reset-success states fire the real toasts.

Run `pnpm dev:client` and open <http://localhost:5173/prototype/auth>. No server needed; the
catalogue imagery loads from the media bucket.

| Variant | Question it answers                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------ |
| A       | Split pane: dark brand pane with the showcase speaker, form on white with uppercase headings and the orange button |
| B       | Imagery behind a centred card: the featured headphones under a dark gradient, white card, black button             |
| C       | Card only: light grey page, dark logo in a slim header, white panel, black button, no imagery                      |

Throwaway code. It lives on the `prototype/352-auth-layout-design` branch and is never merged
to `main`; the verdict goes in `docs/research/auth-layout-design.md`.
