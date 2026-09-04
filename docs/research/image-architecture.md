# Image Architecture Research — audiophile-ecommerce-v5

## Context

Every catalogue image in this project is a hard-coded `https://i.ibb.co/...` URL inside two
TypeScript seed files. That works, but the references are opaque, unmanaged, and (as verified
below) already rotting: 6 of the 128 hosted files return 404 in production today. The user asked
for a research document, not code: derive the real current architecture from the repo, separate
the problem into layers, compare realistic options, and make one proportionate recommendation for
a portfolio project. Nothing in the repo was modified.

**Bottom line (details in §5):** keep images embedded in the product document, but store a
human-readable *storage key* instead of a URL; keep the original files in the repo under a
deterministic `products/<slug>/<role>-<breakpoint>.<ext>` convention; publish them one-way to a
public, zero-egress object bucket with a small sync script; resolve key → URL once, at the API
boundary, from a `MEDIA_BASE_URL` env var. Cloudflare R2 behind a custom subdomain is the
recommended implementation of that model; ImageKit is the named drop-in if no Cloudflare-managed
domain is available. No CMS, no admin UI, no image table.

---

## 1. Current architecture (as verified in the repo)

### 1.1 Files and directories that matter

| Concern | Location |
| --- | --- |
| The only image URLs in the codebase | `packages/database/src/seed/products.seed.ts` (126 URLs), `packages/database/src/seed/categories.seed.ts` (3 URLs) |
| Persistence shape | `packages/database/prisma/schema/product.prisma` (`ProductImages`, `ProductImagesProperties`, `ProductsImagesThumbnail`), `category.prisma` (`CategoriesThumbnail`) |
| Contract / validation | `packages/domain/src/product.ts:36-62`, `category.ts:40-44`, `cart.ts:26-35`, `order.ts:25-33,110-119` |
| Server read path | `apps/server/src/services/product.service.ts` (`toDTO` is a passthrough, nested `images: { select: {...} }` per view), `cart.service.ts:54`, `order.service.ts:41` |
| Server write path | `product.route.ts:20-29` admin-gated `POST/PATCH/DELETE`, `images` is in `PRODUCT_UPDATE_FIELDS` |
| Rendering | `apps/client/src/components/ui/responsivePicture.tsx` (single `<picture>` primitive) + 2 raw `<img>` (category nav, cart item) |
| Client-bundled images | `apps/client/src/assets/{mobile,tablet,desktop}/image-best-gear.jpg` + SVG icons (UI chrome only, via Vite/svgr) |
| Deployment | `render.yaml`: Express on a Render free web service, client as a Render **static site**; MongoDB Atlas |
| Tooling for images | **none** — no scripts dir, no sharp/multer/cloudinary/S3 SDK, no image env vars anywhere |

### 1.2 The actual data flow

```
packages/database/src/seed/*.seed.ts      (TypeScript literals, hand-edited)
        │  pnpm db:seed  (drops the whole DB, then inserts verbatim — no transform)
        ▼
MongoDB Atlas  product.images.{primaryImage,introImage,featuredImage?,showCaseImage?,
               thumbnail, galleryImages[3], relatedProductImage}.{mobileSrc,tabletSrc,desktopSrc}
        │  Prisma nested select per view (intro / related / showcase / featured / thumbnail)
        ▼
Express API   toDTO() = passthrough; cart/order flatten thumbnail.src → productImage
        │  JSON, validated on the client by Zod (z.url())
        ▼
React client  <ResponsivePicture> → <picture> with media="(max-width:767px)" / "(max-width:1023px)"
        │  three separate <source> URLs, <img src={mobileSrc}> fallback
        ▼
https://i.ibb.co/<7-char-hash>/<frontend-mentor-filename>.jpg   (ImgBB, 100% of catalogue images)
        ▼
Browser
```

The user's mental model ("JSON → DB → app → ImgBB") is right in spirit but wrong in two details:
the data is **TypeScript**, not JSON, and there is already a **structured role model** per product
(seven named slots, three breakpoint variants each, alt + aria text). The problem is not the
model; it is that every leaf of the model is an opaque third-party URL.

### 1.3 Facts that constrain the design (all verified this session)

| Fact | Evidence | Why it matters |
| --- | --- | --- |
| 128 distinct URLs, 129 occurrences, one host (`i.ibb.co`), 122 `.jpg` + 6 `.png` | `grep -o` over both seed files | Blast radius of any migration is two files |
| **6 URLs are dead (HTTP 404, ImgBB placeholder PNG)** | GET with browser UA: xx99-mark-one gallery 1 mobile / gallery 2 desktop / gallery 3 mobile; xx99-mark-two gallery 1 mobile; yx1 primary tablet + intro tablet | Production is already broken on 3 of 6 product pages; ImgBB deletes silently |
| Whole catalogue is **~2.4 MB** (118 live files, Content-Length sum 2,327,084 B; largest 209 KB) | HEAD on every URL | Repo storage and any free tier are non-issues |
| Breakpoint variants are **different crops**, not resizes (primary: 654×654 / 562×960 / 1080×1120; gallery-1: 654×348 / 554×348 / 445×280) | `file` on fetched bytes | On-the-fly resizing cannot replace the three-file model; art direction is content |
| ImgBB serves `Cache-Control: max-age=315360000` (10 y) | HEAD | Replacing a file at ImgBB was never possible anyway (new upload = new URL) |
| ImgBB API is upload-only (no list/delete API); ToS forbids commercial use and allows deletion "at any time, without warning" | api.imgbb.com, imgbb.com/tos | No programmatic management is possible; the host is unsuitable by policy, not just taste |
| Filenames repeat across products (`image-product.jpg` ×17, `image-gallery-1.jpg` ×18); only the hash disambiguates | seed grep | The basename carries no identity; migration must key on the full URL |
| `z.url()` is the entire validation surface (`product.ts:40,48-50`, commit `a0efeb9`) | domain package | DTO must stay absolute-URL or the client schema changes |
| Client hard-codes `width`/`height` per call site (e.g. 1080×1120 for primary) while the `<img>` fallback is the 654×654 mobile file | `product/index.tsx:61-72`, `responsivePicture.tsx:31-40` | Dimensions belong with the data, per variant |
| `index.css:101-107` sets `max-width:100%` on `img` without `height:auto`; no `aspect-ratio`; no `decoding`; gallery has no `loading` | client | Delivery fixes are cheap and independent of hosting |
| Render Hobby workspaces include **5 GB/month** outbound bandwidth; static-site traffic counts; without a payment method the workspace is **spun down until next month** when exceeded | render.com/docs/outbound-bandwidth | Serving image bytes from Render itself puts the whole portfolio behind one cap |
| Admin CRUD exists and is role-gated (`authorize("ADMIN")` at router level); body limit is 10 kb; no multipart | `product.route.ts`, `app.ts:52-53` | A URL/key-based admin form works today; an upload endpoint does not |
| Seeding is destructive (`seed/index.ts` drops the DB) and production content is seed-derived | seed script | The repo *is* the CMS; the image workflow should live where the content lives |
| Docs never mention ImgBB; every documented plan says "Cloudinary" (`todos.js:25`, README roadmap, issue #162); `CONTEXT.md` referenced by CLAUDE.md does not exist | docs agent | An ADR is needed; the glossary has no term for image host/key |
| No custom domain in evidence (both services on `*.onrender.com`) | render.yaml, README | Affects which CDN implementation is frictionless (see §5) |

### 1.4 Current weaknesses, by layer

- **Storage:** consumer image host, no account credentials in repo, no management API, ToS
  violation, already losing files.
- **Identity:** a URL is both the identity and the location; the identity is an opaque hash; the
  variant triple is three unrelated uploads with no shared name.
- **Metadata:** alt/aria text present (good); dimensions absent from data and guessed in the client;
  no format/size/hash anywhere.
- **Workflow:** upload → copy → paste into a 700-line TS literal; no listing, no diff, no orphan
  detection, no way to know what a URL is without opening it.
- **Delivery:** correct art direction, but no preconnect, no `decoding`, inconsistent `loading`,
  CSS that defeats the intrinsic size, no error fallback, no modern formats.

---

## 2. Actual problems, categorised

| Category | Problem | Architectural or workflow? |
| --- | --- | --- |
| Storage | Host can and does delete files; no ToS-compliant use; no delete/list API | **Architectural** |
| Storage | Originals exist nowhere under the project's control (only on ImgBB; 6 already gone) | **Architectural** (ownership) |
| Identity | Reference = opaque hashed URL; no human-readable, stable name; variants not grouped | **Architectural** |
| Identity | Replacement impossible without changing the reference (new upload = new URL) | **Architectural** |
| Data model | Embedded roles are right; leaves are URLs; dimensions missing; `ariaLabel` duplicates `alt` and overrides it for assistive tech | Mostly fine; leaf type is the fix |
| Data model | Optionality mismatch: Prisma `?` vs Zod `.nullable()` on `featuredImage`/`showCaseImage` (already `todos.js:58-69`) | Workflow/hygiene |
| Developer experience | Manual upload, copy, paste; nothing lists "images in use"; `altText: "test"` shipped (`products.seed.ts:419`) | Workflow, solved by convention + one script |
| Maintainability | No doc says where images live; roadmap says Cloudinary; nothing enforces validity of references | Workflow (docs, CI check) |
| Performance | No preconnect to image origin; gallery eager; CLS from CSS + wrong intrinsic size; JPEG/PNG only | Workflow (client fixes), independent of hosting |
| Reliability | 6/128 dead, no `onError`, no monitoring | Architectural cause, workflow symptom |
| Migration | Seed wipes users/orders; filenames non-unique; 6 originals must come from the Frontend Mentor starter pack | Constraint on the plan |

The genuinely architectural problems are ownership, identity and replaceability. Everything else
is convention, a script, or a client fix.

---

## 3. Requirements

### Must have
1. Files owned by the project (originals in the repo or in a bucket the project controls).
2. Human-readable, stable identity derived from what the image *is* (product, role, breakpoint).
3. Reference in data ≠ physical location: URL resolved from a base at one boundary.
4. Add / replace / delete = file operation + one command; no copy-pasting URLs.
5. A check that every referenced image exists and every stored image is referenced.
6. Preserve the seven-slot, three-breakpoint art-direction model (it is content).
7. Migration that recovers the 6 dead images and keeps product ↔ image relationships.
8. Zero recurring cost at portfolio traffic; no hard failure mode at a few thousand views.

### Nice to have
- Per-variant `width`/`height` in data (kills hard-coded sizes and mobile CLS).
- Preconnect / `decoding="async"` / consistent `loading` / `height:auto` CSS.
- CI publishes images on merge so "commit = published".
- Local dev without network (server serves the media folder statically).
- Generated manifest (bytes, sha256, dimensions) committed for auditability.
- WebP/AVIF via build-time siblings or edge `format=auto`.

### Unnecessary (for this project)
- An `Image` collection / first-class media entity (no sharing, no independent lifecycle, ~130
  files with a static owner each).
- Admin upload UI, multipart endpoint, presigned uploads (no content editors; the repo is the CMS).
- Headless CMS / DAM (would duplicate Prisma + Express and the seed pipeline).
- Soft-delete, versioned assets, audit trail (git history already is that).
- On-the-fly resizing as the core mechanism (crops differ per breakpoint; resizing is orthogonal).
- Multi-region, signed URLs, private buckets.

---

## 4. Architecture options

### Option A — Keep ImgBB, add a registry
Store a `key → ImgBB URL` manifest in the repo; product data references keys. Fixes readability
only. Storage, ownership, replaceability and the dead-file problem remain; no delete API exists.
Cost $0. Complexity minimal. **Rejected**: does not solve the architectural problems.

### Option B — Repo static assets served by the Render static site
Put originals under `apps/client/public/media/...`; data stores keys; server resolves against the
client origin. Zero accounts, zero secrets, git-versioned, identity by path.
Drawbacks: image bytes count against Render's 5 GB/month with workspace suspension as the failure
mode (≈ 0.4–0.7 MB per product page ⇒ roughly 8–12 k page views/month before the cap, including
JS/CSS); content ownership lands in the client app instead of with the data; no place for a future
upload; cache headers only via `render.yaml` path rules; every PR preview re-ships the files.
Cost $0. Complexity lowest. Portability high (files are just files). Migration easy.
**Kept as the zero-infrastructure fallback**; not primary because of the cap + ownership.

### Option C — Repo-owned originals, path-keyed, published to a public object bucket + CDN  ← recommended
Originals live in a `packages/media/assets/` tree keyed `products/<slug>/<role>-<bp>.<ext>`;
`media:sync` uploads with cache headers; data stores keys; server resolves `MEDIA_BASE_URL + key`;
`media:check` validates references both ways. Implementation: Cloudflare R2 (S3 API, 10 GB free,
zero egress, public bucket on a custom subdomain, optional edge transformations later).
Cost $0 at zero, portfolio, and "hypothetical larger" traffic (free tier is 10 M reads/month).
Complexity: one account, one bucket, one API token in the developer's env, ~150 lines of script.
Portability: the S3 API is the industry standard; only `MEDIA_BASE_URL` and the sync adapter
change. Migration: one import script.

### Option D — Managed image platform with path identity (ImageKit / Cloudinary)
Same key convention and the same `MEDIA_BASE_URL` resolution, but the bucket is the vendor's media
library, which brings a browsing UI, upload API/SDK, CDN, `format=auto` and DPR resizing.
ImageKit free: 20 GB bandwidth, 3 GB storage, no domain needed (`ik.imagekit.io/<id>/<key>`).
Cloudinary free: 25 credits (≈ 25 GB bandwidth or 25 k transforms), but URL structure carries
version segments, and the next tier is $99/month.
Drawbacks: proprietary upload API (portability through the path convention only), a second
place where files can be changed (dashboard) unless one-way sync is a rule, startup free tiers.
**Named fallback** when no Cloudflare-managed domain exists or a media-library UI is wanted;
ImageKit over Cloudinary for identity cleanliness and pricing.

### Option E — Headless CMS / DAM (Sanity, Payload, Strapi) or a first-class `Image` collection with upload endpoint
Full media lifecycle, references, usage tracking, editors. Would duplicate the existing
Prisma/Express data layer or force a second content pipeline; needs body-limit and multipart
changes, storage credentials in the server, an admin UI. Cost $0–$15/month. Complexity highest.
**Rejected** for a six-product, seed-driven catalogue; §9 Phase 3 notes the trigger that would
revive the upload-endpoint variant.

### Comparison

| | A ImgBB+registry | B Static site | C Bucket + keys | D ImageKit | E CMS/DAM |
| --- | --- | --- | --- | --- | --- |
| Ownership of bytes | ✗ | ✓ (git) | ✓ (git + bucket) | ✓ (vendor) | ✓ (vendor/bucket) |
| Human-readable identity | ✓ | ✓ | ✓ | ✓ | ✓ |
| Replace in place | ✗ | ✓ | ✓ | ✓ | ✓ |
| Orphan detection | manual | script | script | dashboard + script | built-in |
| Bandwidth risk | none | Render 5 GB cap | none | 20 GB free | varies |
| New accounts/secrets | 0 | 0 | 1 / 1 | 1 / 1 | 1–2 |
| Cost at portfolio traffic | $0 | $0 | $0 | $0 | $0–15 |
| Lock-in | high (no export API) | none | low (S3) | medium | high |
| Fits future admin upload | ✗ | ✗ | ✓ | ✓ | ✓ |
| Explainable in an interview | weak | ok | strong | ok | overkill |

---

## 5. Recommendation

**Adopt Option C**: path-keyed, repo-owned originals, published one-way to a public object bucket
behind a CDN; key → URL resolved at the API boundary. **Implement the bucket with Cloudflare R2**
exposed on a custom subdomain of the domain already on the user's Cloudflare account (e.g.
`audiophile-media.<that-domain>`). The R2 custom-domain feature only needs a hostname in a zone on
the same Cloudflare account; the app itself stays on Render's default `onrender.com` domains, and
`<img>` loads cross-origin without CORS. One bucket per project keeps keys short and the
`MEDIA_BASE_URL` a plain host. (ImageKit with the same key tree remains the documented fallback
in §4 D, but no prerequisite now blocks R2.)

Why it fits this repository:
- The repo already *is* the CMS (seed literals → destructive reseed). Putting originals beside
  the seed and treating the bucket as a build artifact mirrors `db:seed` exactly: data publishes
  to Mongo, files publish to the bucket. One mental model, two `pnpm` commands.
- The existing embedded role model (`ProductImages`) is kept. ARCHITECTURE.md's justification for
  MongoDB ("image sets per breakpoint live in the document") stays true; only the leaf changes
  from URL to key + dimensions.
- The DTO keeps returning absolute URLs, so the client's `z.url()` contract and the single
  `ResponsivePicture` primitive survive with additive changes (dimensions).
- The server needs no vendor SDK and no storage credential, only `MEDIA_BASE_URL`; write
  credentials live in the developer's env (and optionally one CI secret).

Why it fits the portfolio constraint: one free account, one script package, $0 at every traffic
level, no service that sleeps or pauses, and every piece is standard (S3 API, `Cache-Control`,
`<picture>`), which makes it easy to explain.

Trade-offs accepted:
- Replacement overwrites the same key; propagation relies on a moderate cache TTL (one day) plus
  optional purge, not on immutable content-hashed URLs. Chosen because hashed keys would turn every
  image swap into a data migration. Git history is the version log.
- Two copies of each file (repo + bucket). At 2.4 MB this is free; the repo copy is the source of
  truth and the check script detects drift.
- Public access goes through the custom subdomain, never `r2.dev` (rate-limited and uncached per
  Cloudflare's docs). The media hostname is therefore tied to a domain owned outside this
  project; moving domains later is a `MEDIA_BASE_URL` change plus a cache warm-up.

What this deliberately does **not** solve: editor-facing uploads, user-generated images,
multi-tenant media, sharing one file across products, or automatic WebP/AVIF (optional later).

---

## 6. Proposed data model

Prisma (multi-file schema, `packages/database/prisma/schema/`):

```prisma
// shared, replaces ProductImagesProperties / ProductsImagesThumbnail / CategoriesThumbnail
type ImageVariant {
  key    String   // "products/xx59-headphones/primary-mobile.jpg"
  width  Int
  height Int
}

type ResponsiveImage {
  altText String
  mobile  ImageVariant
  tablet  ImageVariant
  desktop ImageVariant
}

type SingleImage {
  altText String
  image   ImageVariant
}

type ProductImages {
  primaryImage        ResponsiveImage
  introImage          ResponsiveImage
  relatedProductImage ResponsiveImage
  thumbnail           SingleImage
  galleryImages       ResponsiveImage[]
  featuredImage       ResponsiveImage?
  showCaseImage       ResponsiveImage?
}
// Category.thumbnail becomes SingleImage
```

Domain (`packages/domain`), two schemas for the two sides of the boundary:

```ts
// persisted / accepted on create & update
export const ImageKeySchema = z.string().regex(
  /^(products|categories)\/[a-z0-9-]+\/[a-z0-9-]+\.(jpg|png|webp|avif)$/,
);
export const ImageVariantSchema = z.object({
  key: ImageKeySchema, width: z.number().int().positive(), height: z.number().int().positive(),
}).strict();

// returned by the API (what the client already expects, plus dimensions)
export const ImageVariantDTOSchema = z.object({
  src: z.url(), width: z.number().int().positive(), height: z.number().int().positive(),
}).strict();

export const resolveImageUrl = (baseUrl: string, key: ImageKey) => `${baseUrl}/${key}`;
```

Field rationale:
- `key` is the identity **and** the storage path: human-readable, product-scoped, breakpoint-
  qualified, stable across replacements. It never contains a host.
- `width`/`height` per variant: the intrinsic size the browser needs for the file it actually
  picks; removes the hard-coded numbers and the mobile CLS.
- `altText` per responsive image (one description for three crops). `ariaLabel` is dropped:
  on `<img>` it overrides `alt` for assistive tech and every value in the seed is a mechanical
  restatement.
- No `url`, `format`, `bytes`, `sha256`, `createdAt` in the document: derivable (extension, base
  URL) or belongs to the manifest, not to the catalogue.
- Optional slots use one style (`ResponsiveImage?`) on both Prisma and Zod, closing `todos.js:58`.

Key convention (documented in an ADR):

```
products/<product-slug>/<role>[-<n>]-<breakpoint>.<ext>     role ∈ primary|intro|featured|showcase|related|gallery
products/<product-slug>/thumbnail.<ext>
categories/<category-slug>/thumbnail.<ext>
```

The manifest (`packages/media/manifest.json`, generated by `media:check --write`) lists every file
with bytes, sha256, width, height. It is a report and a test fixture, not a runtime dependency.

---

## 7. Proposed workflow

```
drop file(s) into packages/media/assets/products/<slug>/…   (names follow the convention)
        ↓
pnpm media:check     → key regex, every seed reference exists, no orphans, dimensions match
        ↓
edit the product in packages/database/src/seed/products.seed.ts   (key + width/height)
        ↓
pnpm media:sync      → PUT changed objects to the bucket with Cache-Control, --prune deletes removed keys
        ↓
pnpm db:seed (dev)   /  in-place update script (prod)
        ↓
API returns MEDIA_BASE_URL + key   →  <ResponsivePicture> renders it
```

Concrete example — adding "ZX3 speaker" with primary, intro and one gallery image:

1. Add 9 files: `packages/media/assets/products/zx3-speaker/{primary,intro,gallery-1}-{mobile,tablet,desktop}.jpg`
   plus `thumbnail.jpg` and `related-{mobile,tablet,desktop}.jpg` (the schema requires these slots).
2. `pnpm media:check` prints the dimensions to paste (or `--write` updates the manifest); it fails
   if a required slot is missing or a filename breaks the convention.
3. In `products.seed.ts`, add the product with `images.primaryImage.mobile = { key:
   "products/zx3-speaker/primary-mobile.jpg", width: 654, height: 654 }` and so on.
4. `pnpm media:sync` uploads only the new objects. `pnpm db:seed` locally; CI runs `media:check`.
5. Replace an image later: overwrite the file, `media:sync` (purges or waits ≤ 1 day for cache).
6. Delete a product: remove its seed entry and its folder; `media:check` passes; `media:sync --prune`
   removes the objects. Undo = `git revert`.

Optional admin path with zero new server code: the existing admin `PATCH /products/:id` accepts the
same `images` object with keys; `media:check --remote` can verify keys exist in the bucket.

---

## 8. Migration plan

**Phase 0 — Recover originals (prerequisite, source confirmed).** Copy the Frontend Mentor
"audiophile" starter pack (`assets/product-<slug>/{mobile,tablet,desktop}/…`, `assets/shared/…`,
`assets/cart/…`) into the key convention. The starter pack's own layout maps 1:1 onto
`products/<slug>/<role>-<breakpoint>.<ext>`, and it includes the 6 files ImgBB has lost. The
ImgBB copies are used only as a cross-check: `media:import --verify` fetches the 122 live URLs and
compares sha256 against the starter-pack file that replaces each one, so any image that was
edited before upload (e.g. the re-uploaded YX1 "suggestion" set) is flagged rather than silently
reverted.

**Phase 1 — Introduce the model.** Prisma `ImageVariant`/`ResponsiveImage`/`SingleImage`;
domain schemas (persisted vs DTO); `MEDIA_BASE_URL` in server env + `render.yaml`; one
`resolveProductImages()` used by `toDTO`, the nested-select views, cart and order flattening.
Test fixtures (`apps/server/test/helpers/database.ts:68-80`) switch to keys and assert resolved URLs.

**Phase 2 — Rewrite the seed.** `media:import --rewrite` replaces the 129 literals with key +
dimension objects; drops `ariaLabel`; fixes `altText: "test"`. Add `packages/media` with
`assets/`, `check`, `sync`, `import`.

**Phase 3 — Client.** `ResponsivePicture` takes `{ mobile, tablet, desktop, altText }` and uses
per-variant dimensions; category nav and cart item read `src`/`width`/`height` from data;
`<link rel="preconnect">` to the media host in `index.html`; `decoding="async"`; `loading="lazy"`
on gallery; `img { height: auto }`.

**Phase 4 — Publish.** Create bucket, public custom domain, API token; `media:sync`; set
`MEDIA_BASE_URL`; optional GitHub Action that runs `media:sync` on `main` when
`packages/media/assets/**` changes.

**Phase 5 — Production data.** Production users and orders are confirmed disposable, so cut-over
is a plain `pnpm db:seed` against Atlas after `media:sync` has published the bucket (bucket first,
so no request window ever serves keys that do not resolve). No in-place migration script is
needed; the seed is the migration.

**Phase 6 — Verify and cut over.** `media:check --remote` clean; a route test asserts no
`ibb.co` in any DTO; Lighthouse before/after on home and product; watch Render bandwidth.

**Phase 7 — Remove ImgBB.** Grep guard in CI; ADR `docs/adr/0004-images-are-path-keyed-and-published-to-a-bucket.md`
in the existing ADR prose format; README/ARCHITECTURE updated; `todos.js:25` and issue #162's
"Switch to Cloudinary" closed or rewritten.

---

## 9. Implementation scope

### Phase 1 — Minimum viable architecture
- `packages/media/assets/**` with recovered originals under the key convention.
- Prisma + domain model change (§6); `MEDIA_BASE_URL`; single resolver at the API boundary.
- Seed rewritten to keys + dimensions; server tests updated.
- `media:sync` (S3 `PutObject` with `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`, `--prune`).
- `media:check` (references ⇄ files, regex, dimensions) wired into `pnpm test` or a turbo task.
- Client: consume dimensions, preconnect, `decoding`, gallery `loading`, CSS `height:auto`.
- ADR 0004 + docs.

### Phase 2 — Developer experience
- `media:import` retained as a general "pull from URL into convention" tool.
- CI job publishing on merge; `media:check --remote` drift report.
- Express `express.static` mount of `packages/media/assets` under `/media` in development so
  `MEDIA_BASE_URL=http://localhost:8000/media` works offline.
- Committed manifest; a tiny `media:ls` that prints the tree with sizes and the product/role
  each file serves.
- Seed data split into `*.data.ts` (pure literals) and `*.seed.ts` (insertion) so scripts can
  import references without the Prisma client.

### Phase 3 — Optional future improvements (only on a real trigger)
- WebP/AVIF: generate sibling keys at sync time with sharp, or turn on Cloudflare transformations
  (`/cdn-cgi/image/format=auto,width=…/`) on the media subdomain (5,000 unique transformations
  per month free; the catalogue needs a few hundred).
- Cloudflare cache purge in `media:sync` for replaced keys.
- Admin upload endpoint (raise the 10 kb body limit for that route only, multipart, server-side
  key derivation, `PutObject`) **if** an admin dashboard is actually built. The model and keys
  already accommodate it.
- A first-class `Image` collection only if images become shareable across products or come from
  users.

---

## Assumptions and open questions

1. **Domain on Cloudflare — resolved.** The user confirmed another project already lives on
   their Cloudflare account, so a media subdomain can be attached to the R2 bucket there while the
   app stays on Render's default domains.
2. **Frontend Mentor starter pack — resolved.** The user still has it; it is the source of all
   originals, including the 6 files ImgBB lost.
3. **Production users/orders — resolved.** Confirmed disposable; cut-over is a reseed.
4. Render bandwidth numbers are from Render's docs as of this session; the static-site CDN
   behaviour and the $0.15/GB overage are from Render's pricing/blog and may change.
5. Client hero image `image-best-gear.jpg` stays a Vite asset (UI chrome, referenced by code);
   the rule "content images → media package, chrome → client assets" should go in the ADR.

## Appendix — Could the whole project move from Render to Cloudflare?

Asked by the user after the main recommendation. Short answer: the client yes, today, for free;
the Express API only by paying for Containers or by dropping MongoDB. Details:

| Piece | On Cloudflare | Verdict |
| --- | --- | --- |
| Vite SPA (`apps/client/dist`) | Workers Static Assets (or Pages): `not_found_handling: "single-page-application"`, custom domain, requests to static assets "free and unlimited" on both plans | **Move now.** Zero code change; removes the Render 5 GB cap from the client entirely |
| Media (§5) | R2 on the same zone | Already the recommendation; becomes a sibling hostname of the app |
| Express 5 API on **Workers** (free) | `nodejs_compat` + `enable_nodejs_http_server_modules` (compat date ≥ 2025-09-01) lets `http.createServer` + `httpServerHandler` from `cloudflare:node` run Express itself. `node:net` and `node:tls` (`connect`, `TLSSocket`) exist since 2025, and MongoDB's own engineers showed the Node driver (≥ 6.15) reaching Atlas with SCRAM from a Worker | Runtime and raw driver: possible, community-proven, not vendor-listed (Cloudflare's database pages list no MongoDB; the driver README says removing the Node dependency is still in progress). **This repo's data layer: not supported by any vendor document, re-verified 2026-09-04.** Prisma 6.19 MongoDB connector = Rust query engine (`engine: "classic"`), which workerd cannot run; the Cloudflare deploy guide (v7 and current) lists Neon, PlanetScale, `pg`, libsql, D1 and Prisma Postgres only. Prisma 7 has no MongoDB ("use v6.19") and its WASM compiler fails on workerd (prisma/orm #28657, still open Aug 2026). Prisma 8 (`@prisma/orm-mongo` 8.0.0-rc.8, published 2026-09-02, still a release candidate) is TypeScript on `mongodb` ^7, Node ≥ 24, chained API; it exports `./runtime` only, whereas `@prisma/orm-postgres` also exports `./serverless`, the per-request facade used by Prisma's sole Workers example (`examples/prisma-8-cloudflare-worker`, Postgres + Hyperdrive). No Mongo Workers example, no `mongoServerless`, no issue or roadmap item exists. Remaining caveats even on the raw driver: one connection per request or a Durable Object singleton (≈2 s vs ≈300 ms in field reports), Atlas allow-list `0.0.0.0/0`, `bcrypt` native addon → `bcryptjs`, `express-rate-limit` memory store → KV/DO/rate-limit binding, 10 ms CPU per request on Free |
| Express 5 API in **Cloudflare Containers** | Workers Paid $5/month; run the existing Node server as a Docker image behind a tiny Worker binding; Prisma + Atlas unchanged; `sleepAfter` scale-to-zero; included 375 vCPU-min / 25 GiB-h / 200 GB-h per month | **Works unchanged**, needs a Dockerfile (none exists) and a Worker shim. Cold starts still exist (container boot), so the keep-alive cron problem is reduced, not gone. Costs $5/month where Render is $0 |
| Keep the API on Render free | — | **Recommended for now.** `sameSite: "none"` + `secure` cookies and the CORS allowlist already handle a cross-origin client (`auth.controller.ts:52-54`), so client and media can move without touching the server |

The user clarified the goal is a **full move** of the web app and the API, with MongoDB staying on
Atlas. Two shapes satisfy that:

**Shape A — Containers (recommended for a hosting move).** Client on Workers Static Assets, Express
API unchanged inside a Cloudflare Container behind a one-file Worker (`getContainer().fetch(req)`),
media on R2, MongoDB stays on Atlas. Needs: Workers Paid ($5/month), a Dockerfile (none exists), a
`wrangler` config, a `basic` (1/4 vCPU, 1 GiB) or `lite` instance, custom hostnames for app/API/media
on the existing zone. Cold start "often in the 1–3 second range" versus ~1 minute on Render;
`sleepAfter` defaults to 10 min and can be extended; the keep-alive cron can go. Application code,
Prisma, tests and `db:seed` do not change. Included allowances (375 vCPU-min, 25 GiB-h/month) cover
portfolio traffic; egress 1 TB included. The one thing not on Cloudflare is the database, because
Cloudflare has no MongoDB offering; that is a database decision, not a hosting one.

**Shape B — Workers-native, $0, Atlas kept.** Express via `httpServerHandler`, MongoDB reached
through the Node driver over `node:tls`, media on R2, static assets free. The price is the data
layer: no Prisma release runs MongoDB on Workers (6 needs the Rust engine, 7 has no MongoDB, 8 is
an RC with no serverless facade for Mongo), so `packages/database` and all services are rewritten
on the raw `mongodb` driver, a Durable Object holds the connection, `bcrypt` → `bcryptjs`, the
rate limiter gets a shared store, and the mongodb-memory-server harness survives only for the
driver layer. This is a re-platforming to save $5/month, on a path no vendor documents. (A
D1/SQLite variant exists too, but it drops MongoDB and loses `prisma.$transaction` because D1 has
no transactions; it is not what the user asked for.)

*Verification trail (2026-09-04), after the user asked whether the Prisma docs show MongoDB on
Workers:* `prisma.io/docs/prisma-orm/add-to-existing-project/mongodb` (Prisma 8, Node 24+) contains
no mention of Workers, edge, or serverless; `prisma.io/docs/orm/v7/prisma-client/deployment/edge/deploy-to-cloudflare`
and its current non-v7 twin list no MongoDB; `prisma.io/docs/orm/prisma-client/deployment/edge/overview`
likewise; Prisma 8's own repo has a Workers example for Postgres only and a "Serverless Deployment
Guide" scoped to `postgres/serverless`; npm shows `@prisma/orm-mongo` without a `./serverless`
export. What *has* changed since 2024: workerd gained `node:net`/`node:tls`, so the bare MongoDB
driver connects (alexbevi.com 2025-03-25; cloudflare/workerd discussion #2721).

**Effect on the image plan:** none on the architecture; R2 becomes same-account, same-zone as the
app. The one shift: Workers static-asset requests are free and unlimited, so §4 Option B (images
as static assets) loses its bandwidth objection and becomes a legitimate $0 alternative. R2 is
still preferred for content/code separation and a future upload path. Sequencing: do the image
migration first (small, fixes the six live 404s, only `MEDIA_BASE_URL` couples it to hosting),
then the hosting move.

## Sources consulted
Render outbound bandwidth and free-tier docs; Cloudflare R2 pricing and public-bucket docs;
Cloudflare Images pricing and URL-transform docs; Cloudinary, ImageKit, Bunny, Vercel Blob and
Supabase pricing pages; ImgBB API docs and Terms of Service; Vite static-asset docs and
vite-imagetools docs (via Context7); the repository itself (all paths cited above).

## If approved, the next (non-code) steps
1. Save this document as `docs/research/image-architecture.md`.
2. Draft `docs/adr/0004-…md` in the repo's ADR prose style.
3. Open one tracking issue per phase (labels per `docs/agents/triage-labels.md`), superseding the
   "Switch to Cloudinary" line in #162, and file the 6 dead images as a bug now.
