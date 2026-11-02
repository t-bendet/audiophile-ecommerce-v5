# Auth layout design note

Decided 2026-11-02 in the prototype session for [#352](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/352).
This is the document #354, #355 and #356 follow for anything visual. The prototype itself is the
primary source: branch
[`prototype/352-auth-layout-design`](https://github.com/t-bendet/audiophile-ecommerce-v5/tree/prototype/352-auth-layout-design),
route `/prototype/auth`, run with `pnpm dev:client`. It is throwaway code and is never merged.

## Verdict

**Variant A, the split pane, as prototyped.** Nothing is taken from the other two. Rejected: **B**,
catalogue imagery behind a centred card (the featured headphones under a dark gradient, a white
card with the shadcn title style and the black button, the card pinned to the bottom as a sheet on
a phone); **C**, card only (the storefront's light grey page, the dark logo in a slim header, a white
panel, the black button, neutral underlined links, no imagery).

## Decisions

### Relationship to the storefront

Full brand. Manrope throughout; page titles in `text-2xl md:text-3xl font-bold uppercase tracking-300`
with an orange overline above them (`text-xs font-bold tracking-600 uppercase text-primary-500`:
"Account" on login and signup, "Account recovery" on forgot and reset) and a one-line lead in
`opacity-50` below; field labels as the storefront overline (`text-xs font-bold tracking-600 uppercase`);
inputs 3rem tall and square (`rounded-none border-neutral-400`); every submit is the `accent` orange
`Button` at `size="lg"`; links are bold `primary-500`. Catalogue imagery: yes, the ZX9 speaker
showcase cut-out on the dark pane. Rejected: B's black button and shadcn card title with the orange
reserved for links, C's no orange and no imagery.

### Layout

A split pane from `lg` up. The left pane takes 5 of 12 columns on `neutral-900`: the logo top-left,
the pattern circles at 40% opacity behind the speaker image centred in the pane, and the tagline
"Bringing you the best audio gear" bottom-left in `text-2xl font-bold uppercase tracking-300` with
"best" in orange, as the best-gear section writes it. The right pane takes 7 columns on white: a
"Back to Home" link top-right (the existing `link` button), and the form at `max-w-md`, left-aligned
and vertically centred, with no card and no border.

Below `lg` the pane collapses to a 4.5rem `neutral-900` band with the logo left and a "Home" overline
link with an arrow right. The form fills the width with 1.5rem side padding, starts 2.5rem below the
band, and is not vertically centred. Rejected: B's card as a bottom sheet over the image, C's
edge-to-edge white panel under a grey header.

### The forgot-password page

Overline, title "Forgot your password?", lead "Enter the email you signed up with and we will send
you a link to set a new one.", one email field, the button "Send reset link", and "Remembered it?
Back to login" under it.

The sent state replaces the form in place: a 3.5rem orange circle with the lucide `MailCheck` icon,
the overline, title "Check your inbox", the copy "If an account exists for **{email}**, we have sent
it a link to reset the password. The link works once and expires in {expiry}.", a second line
"Nothing there? Check your spam folder, or try another email." whose link returns to the form, and an
outline "Back to login" button. The copy is identical for a known, unknown or deactivated email.
`{expiry}` renders the named constant #354 defines; the prototype shows "one hour". Rejected: B's
"Send it again" button in the sent state (a second send is a second request; the link back to the
form is enough).

### The reset-password page

Overline, title "Set a new password", lead "Choose a password you have not used on this site
before.", "New password" with the signup strength meter and the hint "Between 8 and 20 characters."
under it, "Confirm new password", and the button "Save new password". The rules are the signup rules:
`PasswordValidator` (8 to 20 characters) and the confirmation must match.

### The invalid-or-expired-link state

One state for an invalid, expired or already-used token: a 3.5rem `neutral-900` circle with the
lucide `TimerOff` icon, the overline, title "This link has expired", the copy "Reset links work once
and expire after {expiry}. Request a new one and we will email it to you.", an accent "Request a new
link" button to the forgot page, and a "Back to login" link. The page renders the form without
checking the token first; when the save answers the token's error code the state replaces the form.
Rejected: a separate wording per cause (the shopper's next step is the same).

### After a successful reset

The shopper is signed in and lands on `/account/profile`, with the success toast "Password updated"
and the description "You are signed in with your new password." There is no interstitial page.
Rejected: landing on the login page with a message.

### The login page

"Forgot your password?" sits in the Password label row, right-aligned, in `text-sm font-bold text-primary-500`.
The title is "Welcome back" with the lead "Sign in to see your orders and check out faster.", and
"Don't have an account? Sign up" sits under the button. Rejected: B's link centred under the button,
C's link right-aligned under the password input.

### The signup page

The same frame: overline "Account", title "Create your account", lead "Your orders, addresses and
receipts in one place.", then Full name, Email, Password with the strength meter and the
"Between 8 and 20 characters." hint, Confirm password, the button "Create account", and "Already have
an account? Login" under it. The "By clicking continue, you agree to our Terms of Service and
Privacy Policy" footer with its two dead links is dropped from all four pages until there are pages
to link.

### States

Pending: the submit button is disabled and shows the `Spinner` beside a progress label ("Signing
in", "Creating account", "Sending", "Saving"); there is no page overlay. So that the four forms match,
#356 removes the login and signup mutation keys from the root layout's full-page overlay, which keeps
the logout key and the user fetch. Inline error: `FieldError` under the field, with the `Field`'s
`data-invalid` turning the label and input `destructive`; client validation comes from the domain
schema, server details land through `applyServerErrors`, and unmatched messages toast per the client
guide ("Login Failed" for wrong credentials, "Too many requests" when the forgot route answers 429).
The deactivated line under the login button stays as it is. Success: forgot shows the sent state in
place; reset navigates and toasts.

## Primitives and dependencies

Nothing new. `Card` is no longer used on the auth pages; `Field`, `Input`, `Button`, `Spinner`, the
strength meter and the visibility toggle are reused, and the icons are `MailCheck`, `TimerOff` and
`ArrowLeft` from `lucide-react`. The pane image is UI chrome, not catalogue content: copy
`packages/media/assets/products/zx9-speaker/showcase-desktop.png` (410 by 493) to
`apps/client/src/assets/desktop/image-auth-speaker.png`, as the best-gear hero lives in the client
per the [media guide](../../packages/media/README.md). Only the desktop file is needed because the
phone band shows no image. The pattern circles are already a client asset.

## Findings from the prototype

- The storefront `<body>` defaults to white text, as the admin note found. The auth layout must set
  `text-neutral-900` on its root.
- `Field`'s `data-invalid` colours every descendant's text `destructive`, so a hint rendered inside
  the field goes red along with the error. Give the hint its own `text-neutral-500` or render it
  outside the `Field`.
- The logo SVG fills white and only reads on the dark band and pane. C needed a
  `[&_path]:fill-neutral-900` override to sit on grey.
- A `min-h-svh` grid with two auto rows shares the spare height between the band and the form on a
  phone, which stretched the band to 10rem. `grid-rows-[auto_1fr]` keeps it at 4.5rem.
- The showcase PNG has a transparent background and needs no mask on `neutral-900`.
- The XX99 Mark II featured photo is dark and vanishes under any gradient strong enough to keep a
  white card legible, which is why B's imagery did not carry.
