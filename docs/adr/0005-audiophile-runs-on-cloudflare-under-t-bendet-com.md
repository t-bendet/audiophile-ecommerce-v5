# Audiophile runs on Cloudflare under t-bendet.com, with MongoDB unchanged on Atlas

Hosting moves from Render to Cloudflare in three parts (#189). The Vite build is served as
Workers Static Assets; the Express 5 server runs unchanged inside a Cloudflare Container behind a
one-file Worker; product images live in an R2 bucket. MongoDB stays on Atlas. The app and its API
answer on `audiophile.t-bendet.com`, the bucket on `audiophile-media.t-bendet.com`, and both are
first-level subdomains of the portfolio domain, which keeps the apex and `www`. The API is
path-routed: the one Worker sends `/api/*` to the container before falling through to static
assets, so the client's default `VITE_APP_API_URL` of `/api/v1` works unchanged and the auth cookie
becomes same-origin. Prisma stays on the latest 6.x; Prisma 7 and 8 are excluded from the
dependency upgrade.

Images follow one rule: catalogue content (product and category images, the ones the seed
references by URL) goes to the media package that #204 introduces and is served from the bucket;
UI chrome stays a client asset bundled by Vite. `image-best-gear.jpg` under
`apps/client/src/assets` is chrome, since code references it rather than data, and it stays where
it is with the SVG icons.

The evidence behind each part is in `docs/research/cloudflare-move.md` and the appendix of
`docs/research/image-architecture.md`; this record exists so the later stages of the move point at
one decision instead of the research.

## Considered options

Running the API on plain Workers, which would be free, was rejected because no Prisma release runs
this repo's data layer there (verified 2026-09-04). Prisma 6.19's MongoDB connector needs the Rust
query engine, which workerd cannot run; Prisma 7 has no MongoDB connector; Prisma 8's MongoDB
package was still a release candidate with no serverless facade and no Workers example. The bare
MongoDB driver does reach Atlas from a Worker, but only by dropping Prisma. A container runs the
server as it is.

Migrating to SQL to make Workers possible was rejected, along with any research into it. The data
layer is not the problem this move solves.

Staying on Render was rejected. Its free tier caps outbound bandwidth at 5 GB a month with the
workspace spun down until the next month if that is exceeded without a payment method,
static-site traffic counts against it, and the cheapest always-on service costs more than the
Workers Paid plan the container needs.

Hostnames deeper than one level, such as `api.audiophile.t-bendet.com`, were rejected because the
free Universal SSL certificate covers the apex and first-level subdomains only; anything deeper
needs Total TLS or an advanced certificate. A separate first-level hostname for the API was
rejected in favour of path routing: it would keep the cookie cross-origin, and with it the
`sameSite: "none"` setting in `apps/server/src/controllers/auth.controller.ts` and the
`ALLOWED_ORIGINS` CORS list, both of which path routing makes dead configuration. The bucket's
`r2.dev` URL was rejected for public access because it is rate-limited and uncached; the custom
domain is the supported shape.

Upgrading Prisma with the rest of the dependencies was rejected. `prisma@latest` resolved to an
8.0.0 release candidate that replaces the generated client with a different API, and Prisma 7
drops MongoDB. Prisma 8 becomes its own effort once it is generally available; its prize is
dropping the Rust engine, which is what would let the container fit the smallest instance.

Moving the hero image to the bucket with the catalogue was rejected. Nothing in the database
refers to it, so a bucket URL for it would be a string in a component either way, and Vite already
hashes and serves it.

## Consequences

`render.yaml` and the deployment docs (the README deployment section, `docs/ARCHITECTURE.md`, the
`CLAUDE.md` environment section and every `.env.example`) stay authoritative until the API cutover
ticket (#210) closes. Until then Render is production, and each stage of the move leaves it working
and is reversible by a DNS change.

The container instance is `basic`. #209 measured the real image (Node 24, the Express bundle, the
generated Prisma client with its Rust engine) in Docker on 2026-09-11, natively on arm64 and under
the resource limits of each instance type. Resident memory settled at 110 MB with the products and
categories routes warm, so memory alone would allow lite with about 140 MiB of headroom. CPU does
not: under lite's 1/16 vCPU the server took 12.7 s from `docker run` to a `200` on `/api/v1/health`
and a burst of thirty product requests degraded to 2 s each, against 1.6 s and 5 ms under basic's
1/4 vCPU, and 0.4 s unconstrained. The one-to-three-second cold start the spec accepts is only met
by basic, so basic it is; the extra cost is about 65 cents a month at three hours awake a day. The
measurement used a hard CPU quota; if the platform turns out to let lite burst at boot, this line
can be revisited with the same routine.

The media hostname is recorded here rather than in the separate ADR the image research proposed.
