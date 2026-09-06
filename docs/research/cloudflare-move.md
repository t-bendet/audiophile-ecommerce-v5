# Moving Audiophile to Cloudflare — hand-off document

Written 2026-09-06 as the input for a `/to-spec` session. It records what was decided in the
sessions of 2026-09-04 to 2026-09-06, the evidence behind each decision, the three questions still
open, and the execution order. It complements
[`image-architecture.md`](./image-architecture.md), which holds the image research in full and whose
appendix carries the Cloudflare and Prisma verification trail; this document does not repeat that
detail, it points at it.

## Destination

The Audiophile client, API and product images run on Cloudflare under the portfolio domain, with
MongoDB unchanged on Atlas, Render switched off, dependencies current, and the six product images
that are broken in production today served again from storage the project owns.

## Decisions

Each decision names the evidence it rests on. "Research doc" means `image-architecture.md`.

1. **Hosting is Cloudflare, in three parts.** The Vite build is served as Workers Static Assets;
   the Express 5 server runs unchanged inside a Cloudflare Container behind a one-file Worker;
   product images live in an R2 bucket. Evidence: research doc §5 and appendix; Cloudflare
   Containers and Workers pricing pages.
2. **MongoDB stays on Atlas. No SQL migration, no SQL research.** Plain Workers cannot run this
   repo's data layer: Prisma 6.19's MongoDB connector needs the Rust query engine, Prisma 7 has
   no MongoDB, and Prisma 8's MongoDB package (8.0.0-rc.13, still a release candidate) has no
   serverless facade and no Workers example. The bare MongoDB driver does reach Atlas from a
   Worker since 2025, but only by dropping Prisma. Evidence: research doc appendix, "Verification
   trail (2026-09-04)".
3. **Hostnames are single-level subdomains of `t-bendet.com`.** `audiophile.t-bendet.com` serves
   the app and, under `/api/*`, the API; `audiophile-media.t-bendet.com` is the R2 bucket's custom
   domain. Nothing deeper: the free Universal SSL certificate covers the apex and first-level
   subdomains only. The portfolio keeps the apex and `www`. Evidence: Cloudflare Universal SSL
   docs; the domain is confirmed from the portfolio repository.
4. **The API is path-routed under the app hostname.** One Worker serves static assets and sends
   `/api/*` to the container first. The client's default `VITE_APP_API_URL` of `/api/v1` then
   works unchanged, cookies become same-origin, and the `sameSite: "none"` setting in
   `apps/server/src/controllers/auth.controller.ts` and the `ALLOWED_ORIGINS` CORS list become
   dead configuration.
5. **Prisma stays on the latest 6.x.** Prisma 7 and 8 are excluded from the dependency upgrade
   because `prisma@latest` currently resolves to an 8.0.0 release candidate that replaces the
   generated client with a different API. Prisma 8 is revisited in its own effort once it is
   generally available; its prize is dropping the Rust engine, which is what would let the
   container fit the smallest instance.
6. **Dependencies are upgraded before the move, in three pull requests by risk group**, each
   deployed to Render before the next, so that breakage is debugged on a known platform.
7. **The keep-alive workflow is deleted at cutover.** `.github/workflows/keep-alive.yml` pings
   every ten minutes; left running it holds the container awake around the clock and roughly
   doubles the bill. Cloudflare quotes container cold starts of one to three seconds.
8. **Image hosting is split in two.** The bytes move first: originals from the Frontend Mentor
   starter pack into the repo under `products/<slug>/<role>-<breakpoint>.<ext>`, published to R2,
   and the seed reseeded with the new URLs in the existing `mobileSrc`/`tabletSrc`/`desktopSrc`
   fields. No schema change. The data model of research doc §6 (keys and dimensions in the
   document, resolver behind `MEDIA_BASE_URL`, `ariaLabel` dropped, client reading sizes from
   data) is the last stage, so it never interleaves with the platform move.
9. **ADR 0005 is written before any work starts.** It records decisions 1 to 5 in the repo's ADR
   prose style. The media hostname is folded into it, which supersedes the research doc's
   proposal of a separate "ADR 0004"; that number is now taken by the local replica-set ADR.
   Its Consequences section states that `render.yaml` and the deployment docs stay authoritative
   until the cutover ticket closes.
10. **Cost is accepted at $5 per month base.** See "Cost" below.

## Facts the decisions rest on

| Fact                                                                                                                                                                                                                                  | Source                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 6 of the 128 catalogue image URLs return 404 today (xx99 mark one: gallery 1 mobile, gallery 2 desktop, gallery 3 mobile; xx99 mark two: gallery 1 mobile; yx1: primary tablet, intro tablet)                                         | GET against every seed URL, 2026-09-04                                 |
| The whole catalogue is about 2.4 MB across 122 JPEG and 6 PNG files; breakpoint variants are different crops, not resizes                                                                                                             | HEAD and `file` on the fetched bytes                                   |
| Render Hobby workspaces include 5 GB/month outbound bandwidth, static-site traffic counts, and the workspace is spun down until the next month if exceeded without a payment method                                                   | render.com/docs/outbound-bandwidth                                     |
| Workers Paid is $5/month with 10 million requests included; static-asset requests are free and unlimited on both plans                                                                                                                | developers.cloudflare.com/workers/platform/pricing                     |
| Containers need Workers Paid; memory and disk are billed on the provisioned instance size while awake, CPU on actual use, nothing while asleep; included 25 GiB-h memory, 375 vCPU-min, 200 GB-h disk per month; 1 TB egress included | developers.cloudflare.com/containers/pricing                           |
| Instance sizes: lite 1/16 vCPU, 256 MiB, 2 GB; basic 1/4 vCPU, 1 GiB, 4 GB; standard-1 1/2 vCPU, 4 GiB, 8 GB                                                                                                                          | same                                                                   |
| Container cold starts "often in the 1–3 second range"; `sleepAfter` defaults to 10 minutes                                                                                                                                            | developers.cloudflare.com/containers/faq                               |
| R2 free tier: 10 GB storage, 1 M class A and 10 M class B operations per month, zero egress; public access should use a custom domain, `r2.dev` is rate-limited and uncached                                                          | developers.cloudflare.com/r2                                           |
| Universal SSL covers the apex and first-level subdomains; deeper levels need Total TLS or advanced certificates                                                                                                                       | developers.cloudflare.com/ssl/edge-certificates/universal-ssl          |
| Workers custom domains create the DNS record and certificate automatically                                                                                                                                                            | developers.cloudflare.com/workers/configuration/routing/custom-domains |
| Prisma on Workers: no Prisma release runs MongoDB there; details and links in the research doc appendix                                                                                                                               | prisma.io docs, prisma/orm repository, npm registry, 2026-09-04        |
| The auth cookie already uses `sameSite: "none"` with `secure`, so a cross-origin client works during the transition                                                                                                                   | `apps/server/src/controllers/auth.controller.ts:52-54`                 |
| Server body limit is 10 kb and there is no multipart handling; irrelevant to this move, relevant to any future upload endpoint                                                                                                        | `apps/server/src/app.ts:52-53`                                         |
| The portfolio repository's asset research concerns Astro illustrations; no bucket or hostname collision                                                                                                                               | `~/Projects/tbendet/docs/research/asset-pipeline.md`                   |

## Cost

| Scenario                                        | lite                                  | basic        |
| ----------------------------------------------- | ------------------------------------- | ------------ |
| Container awake about 3 h/day, asleep otherwise | $5.00 (usage within included amounts) | about $5.65  |
| Container awake 24/7                            | about $6.70                           | about $12.00 |

Static assets, R2, custom hostnames and the routing Worker add nothing. Atlas is unchanged from
today. If the Cloudflare account already pays for Workers Paid because of the portfolio, the $5
line is already paid and only the usage column applies. For comparison, Render today is $0 with
the bandwidth cap and a one-minute cold start; its cheapest always-on service is $7/month.

## Open questions

Three remain. None changes the route; each is answered inside the stage that needs it.

1. **Instance size.** Node plus Prisma 6's Rust engine usually sits between 100 and 180 MB
   resident; lite gives 256 MiB. Decided by measuring the real image in the container prototype.
2. **Image build.** Whether Workers Builds can build the container image from the repository or a
   GitHub Action with Docker is needed for `wrangler deploy`. Looked up in the deploy-pipeline
   ticket.
3. **Framework majors.** React Router 8 and TypeScript 7 each need their migration guide read at
   the start of their upgrade PR; TypeScript 7 also needs the ESLint and Vite plugins to support
   it.

## Execution order

Every stage leaves production working and is reversible by a DNS change. Each lists repo work,
which an agent can do, and console work, which needs the account owner.

**Stage 0 — ADR 0005.** Repo: the ADR, and the research doc's "ADR 0004" line corrected. Done
when merged.

**Stage 1 — Image bytes.** Repo: `packages/media/assets/**` from the starter pack under the key
convention; `media:sync` (S3 PutObject with `Cache-Control: public, max-age=86400,
stale-while-revalidate=604800`, `--prune`); `media:check` (every seed reference exists, no
orphans); seed rewritten to the new URLs; `media:import --verify` comparing the 122 live ImgBB
files against the starter pack and flagging edited ones. Console: R2 bucket, custom domain
`audiophile-media.t-bendet.com`, an API token for the sync script. Done when no `ibb.co` URL
remains in the seed, the six dead images render, and a route test asserts the host.

**Stage 2 — Dependency upgrade, three PRs.**

| Group              | Packages                                                                                                                                                                                                                  | Risk                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Minors and patches | React 19.2.8, `react-dom`, Radix UI packages, Tailwind 4.3 (`@tailwindcss/vite`, `@tailwindcss/postcss`), `@tanstack/eslint-plugin-query`, postcss, nodemon, slugify, `@types/react*`                                     | Low                            |
| Tooling majors     | Vite 8, Vitest 5, ESLint 10 with `@eslint/js`, `eslint-config-prettier` 10, `eslint-plugin-react-hooks` 7, `globals` 17, `@vitejs/plugin-react` 6, `vite-plugin-svgr` 5, `vite-tsconfig-paths` 6, rimraf 6, `@types/node` | Medium, config only            |
| Framework majors   | React Router 8, `lucide-react` 1.x, TypeScript 7                                                                                                                                                                          | High, one migration guide each |
| Excluded           | Prisma 7 and 8; Node stays on 24 LTS (repo requires 24.5+, Render pins 24.13, Node 26 exists)                                                                                                                             | —                              |

Console: none. Done when each PR is green in CI and deployed to Render.

**Stage 3 — Client on Cloudflare.** Repo: wrangler config for Workers Static Assets with
`not_found_handling: "single-page-application"`, `VITE_APP_API_URL` pointing at the Render API
for now, the new origin added to `ALLOWED_ORIGINS`, a note that Render PR previews are replaced by
Workers preview URLs. Console: custom domain `audiophile.t-bendet.com`. Done when the app serves
from Cloudflare against the Render API and Render's client service is paused.

**Stage 4 — Container prototype, timeboxed.** Repo: a multi-stage Dockerfile for `apps/server`
built from `turbo prune --scope=server --docker`, the container binding in wrangler config, the
one-file Worker forwarding requests, a health route check. Console: Atlas network access for
Cloudflare egress (no fixed IP), secrets `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
`JWT_COOKIE_EXPIRES_IN`, `NODE_ENV` as Worker secrets and vars passed to the container. Done when
the product routes answer from the container, resident memory and cold start are measured, and
the instance size is written into ADR 0005. The artifacts are kept: they are the production ones.

**Stage 5 — API cutover.** Repo: `/api/*` routed to the container before static assets on the app
hostname; client back to the default `/api/v1`; `ALLOWED_ORIGINS` and `sameSite: "none"` removed
or documented as dead; `keep-alive.yml` deleted. Console: Render server switched off. Done when
login, cart and checkout work end to end on `audiophile.t-bendet.com` with Render off.

**Stage 6 — Cleanup and docs.** Repo: `render.yaml` removed; README deployment section,
`docs/ARCHITECTURE.md`, `CLAUDE.md` environment section and every `.env.example` rewritten;
CI deploy step (answers open question 2); a comment on issue #162 marking its Cloudinary, WebP
and preload lines superseded. Done when a fresh clone's docs describe only Cloudflare.

**Stage 7 — Image data model.** Repo: research doc §6 in full: `ImageVariant`, `ResponsiveImage`,
`SingleImage` composite types with keys and dimensions; persisted-versus-DTO Zod schemas;
`MEDIA_BASE_URL` resolver at the API boundary; `ariaLabel` dropped; `ResponsivePicture` and the
two raw `<img>` sites reading sizes from data; `preconnect`, `decoding="async"`, `loading="lazy"`
on the gallery, `img { height: auto }`; `media:check` extended to dimensions and a committed
manifest. Depends on stage 1 only. Done when the server tests assert resolved URLs and Lighthouse
shows no layout shift on the product page.

Blocking: 0 → 1 → 2 → 3 → 4 → 5 → 6, and 7 after 1.

## Out of scope

- Any SQL migration, and any research into one.
- Running the API on plain Workers, whether on the bare MongoDB driver or on Prisma 8.
- Prisma 7 or 8 in the dependency upgrade. Prisma 8 becomes its own effort at general
  availability.
- An admin upload UI, a multipart endpoint, a CMS, or a first-class image collection; research doc
  §3 explains why.
- Node 26.

## Sources

Cloudflare: Workers pricing, Containers pricing and FAQ, R2 pricing and public buckets, Universal
SSL, Workers custom domains, Workers Static Assets, Node.js `net`/`tls`/`http` compatibility.
Render: outbound bandwidth and free-tier docs. Prisma: the MongoDB and Cloudflare deployment pages
for v7 and current, the prisma/orm repository examples and Serverless Deployment Guide, npm
registry metadata for `@prisma/orm-mongo` and `@prisma/orm-postgres`, issue prisma/orm#28657.
MongoDB: the Node driver README and the 2025 Workers write-up by a MongoDB engineer. Repository:
paths cited inline; `pnpm outdated -r` on 2026-09-06.
