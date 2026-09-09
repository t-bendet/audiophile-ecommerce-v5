# @repo/media

The catalogue's image originals and the tools that move them. Every product and
category image is owned by this package and served from
`https://audiophile-media.t-bendet.com/<key>` — a Cloudflare R2 bucket behind a
custom domain (see `docs/adr/0005-audiophile-runs-on-cloudflare-under-t-bendet-com.md`).

## Key convention

`assets/` is the bucket, one file per key:

```
products/<slug>/<role>[-<n>]-<breakpoint>.<ext>
products/<slug>/thumbnail.<ext>
categories/<slug>/thumbnail.<ext>
```

`<role>` is one of `primary`, `intro`, `featured`, `showcase`, `related`,
`gallery`; only `gallery` carries the `-<n>`. `<breakpoint>` is `mobile`,
`tablet` or `desktop`. The client's best-gear hero is UI chrome, not catalogue
content, and stays in `apps/client`.

One key is shared: XX99 Mark II's `primaryImage.desktopSrc` and
`introImage.desktopSrc` have always pointed at the same image, so both reference
`products/xx99-mark-two-headphones/intro-desktop.jpg`. The starter pack's
separate `desktop/image-product.jpg` for that product is unused.

## Scripts

```bash
pnpm --filter @repo/media media:check            # missing / orphaned files (also a vitest test)
pnpm --filter @repo/media media:import --verify  # network: compare the repo copies to ImgBB
pnpm --filter @repo/media media:sync             # upload changed objects to R2
pnpm --filter @repo/media media:sync --prune     # ...and delete keys that no longer exist here
```

`media:check` reads the seed literals and the assets tree and fails when a
referenced file is missing or a file is unreferenced. It runs under vitest, so
`pnpm test` and CI enforce it without network or Docker.

`media:import --verify` is the one-off migration audit: it refetches every
pre-migration ImgBB URL (frozen in `src/legacy-imgbb.ts`) and compares sha256
with the file that replaced it. **A `differs` row is a question for the
maintainer, not something to resolve silently** — it means the live image was
edited after upload and the repo copy would revert it.

`media:sync` uploads with
`Cache-Control: public, max-age=86400, stale-while-revalidate=604800` and skips
objects whose ETag already matches. Its credentials belong to the developer
running it, never to the deployed server; see `.env.example`.

## Console steps (account owner)

Create the R2 bucket, attach `audiophile-media.t-bendet.com` to it, and mint an
Object Read & Write API token scoped to that bucket. Then, once this is merged:
`pnpm --filter @repo/media media:sync`, followed by `pnpm db:seed` against
Atlas.
