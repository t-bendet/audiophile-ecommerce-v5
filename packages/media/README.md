# @repo/media

The catalogue's image originals and the tools that move them. Every product and
category image is owned by this package and served from
`https://audiophile-media.t-bendet.com/<key>` — a Cloudflare R2 bucket behind a
custom domain (see [ADR 0005](../../docs/adr/0005-audiophile-runs-on-cloudflare-under-t-bendet-com.md)).

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

There are 129 files for 128 pre-migration ImgBB URLs. XX99 Mark II's desktop
primary image used to point at the same URL as its desktop intro image — the
category-page preview rather than the product shot. That was a slip when the images were first uploaded, confirmed by the
maintainer, so `primary-desktop.jpg` now holds the starter pack's real
`desktop/image-product.jpg` and the two roles no longer share a file.

## Scripts

```bash
pnpm --filter @repo/media media:check            # missing / orphaned files, stale manifest, wrong dimensions
pnpm --filter @repo/media media:check --write    # regenerate manifest.json from the tree
pnpm --filter @repo/media media:import --verify  # network: compare the repo copies to ImgBB
pnpm --filter @repo/media media:sync             # upload changed objects to R2
pnpm --filter @repo/media media:sync --prune     # ...and delete keys that no longer exist here
```

`media:check` reads the seed literals and the assets tree and fails when a
referenced file is missing, a file is unreferenced, the manifest is behind the
tree, or a reference states a size the file does not have. The same checks run
under vitest, so `pnpm test` and CI enforce them without network or Docker.

## The manifest

`manifest.json` lists every file under `assets/` by key with its bytes, sha256
and pixel size. It is committed so that adding, replacing or resizing an image
shows up in a diff, and it is the dimensions source the check holds references
to. It is a report and a test fixture, never a runtime dependency: nothing the
server or client ships reads it.

Add or replace a file, then `media:check --write`; regenerating from an
unchanged tree reproduces the file byte for byte, so a dirty `manifest.json`
after `--write` means the tree really did change.

The dimension check is per reference, and every reference in the seed is now a
`{ key, width, height }`, so all 129 are held to their file's pixel size. A key
that states only one dimension, or none, is an error rather than a reference the
check quietly skips.

`media:import --verify` is the one-off migration audit: it refetches every
pre-migration ImgBB URL (frozen in `src/legacy-imgbb.ts`) and compares sha256
with the file that replaced it. **A `differs` row is a question for the
maintainer, not something to resolve silently** — it means the live image was
edited after upload and the repo copy would revert it.

`media:sync` uploads with
`Cache-Control: public, max-age=86400, stale-while-revalidate=604800` and skips
objects whose ETag already matches. Its credentials belong to the developer
running it, never to the deployed server; see `.env.example`.

## Publication

After changing catalogue images, run `media:check --write` and review the manifest diff, then
upload with `pnpm --filter @repo/media media:sync`. Publish image bytes before catalogue records
that reference new keys. Catalogue changes use `pnpm db:sync`, following the database guide's
[seeding vs syncing](../database/README.md#seeding-vs-syncing) instructions; `db:seed` is local-only.
Normal deployments run catalogue sync through CI, as described in the
[deployment runbook](../../docs/deployment.md).

Use `--prune` only when removing the obsolete bucket keys is intended. It deletes remote objects
that are absent from this package, including any keys an older deployment may still reference.

## Initial bucket setup

Create the R2 bucket, attach `audiophile-media.t-bendet.com` to it, and mint an
Object Read & Write API token scoped to that bucket. Put the upload credentials in this package's
`.env`, using [`.env.example`](.env.example), then follow the publication steps above.
