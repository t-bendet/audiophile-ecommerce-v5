# Deployment

Read this before deploying by hand, changing Worker configuration or secrets, or editing the
deployment workflow. The hosting decision and rejected alternatives are in
[ADR 0005](adr/0005-audiophile-runs-on-cloudflare-under-t-bendet-com.md).

## Runtime and configuration

One Worker serves [audiophile.t-bendet.com](https://audiophile.t-bendet.com): `/api/*` and
`/sitemap.xml` go to the Express server in a Cloudflare Container; other paths serve the Vite
build with an SPA fallback, `robots.txt` among them.
Catalogue images come from R2 at `audiophile-media.t-bendet.com`; MongoDB is on Atlas.

The configuration authorities are:

- [`apps/server/wrangler.jsonc`](../apps/server/wrangler.jsonc): assets, API-first routing,
  container image/binding, instance limits and non-secret environment values.
- [`apps/server/worker/index.ts`](../apps/server/worker/index.ts): forwards API and sitemap
  requests and environment variables to the container. It forwards the original protocol so
  HTTPS responses can set secure cookies across the Worker-to-container HTTP connection and the
  sitemap lists `https` URLs.
- [`apps/server/Dockerfile`](../apps/server/Dockerfile): image build, runtime and health check.
  Keep its Node major aligned with [`.nvmrc`](../.nvmrc); CI checks that agreement.
- [`apps/client/.env.production`](../apps/client/.env.production): the build-time API URL,
  `/api/v1`. App and API are same-origin; the server has no CORS middleware.
- [`apps/client/public/_headers`](../apps/client/public/_headers): client security headers.

An unknown API path must return the server's JSON 404, not the SPA shell. `run_worker_first`
and the Worker's path check preserve that boundary; both name `/sitemap.xml` alongside the API
prefix, so the sitemap is built by the server rather than served as an asset.

## Production environment

No server `.env` file is deployed. The Worker passes its four `vars` (`NODE_ENV`,
`JWT_EXPIRES_IN`, `JWT_COOKIE_EXPIRES_IN`, `MEDIA_BASE_URL`) and two secrets (`DATABASE_URL`,
`JWT_SECRET`) into the container. Read their current plain values in `wrangler.jsonc`.
`PORT` comes from the Dockerfile and must match the Worker's `defaultPort`.

Set Worker secrets from `apps/server`, using Wrangler's interactive input:

```bash
pnpm exec wrangler secret put DATABASE_URL
pnpm exec wrangler secret put JWT_SECRET
```

`JWT_SECRET` requires at least 32 characters. The production database URL must match the Atlas
`mongodb+srv://.../<database>?retryWrites=true&w=majority&appName=<name>` shape validated by
[`src/utils/env.ts`](../apps/server/src/utils/env.ts); copy the supplied Atlas string with the
intended database name. `MEDIA_BASE_URL` must be an absolute URL without a trailing slash.

The Atlas database user needs read/write access. The current deployment has no fixed container
egress IP, so its Atlas network configuration permits `0.0.0.0/0`; database credentials control
access. This is production configuration, not a reason to point local development at Atlas.

R2 upload credentials belong to the developer running media sync, not to the Worker or container.
See the [media guide](../packages/media/README.md) and its `.env.example`.

## Normal deployment

A push to `main` deploys through [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
The `deploy` job waits for **`verify`, `image`, and `e2e`**, then runs `pnpm deploy:app`.
That builds both apps and deploys the container image, Worker and static assets together.
Pull requests run checks and build the Docker image without publishing or deploying it.

The workflow uses these repository secrets:

| Secret                  | Purpose                                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Account-scoped deployment token with Worker, Container and managed image-registry permissions; the existing setup uses the Edit Cloudflare Workers template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account to deploy into                                                                                                                           |
| `DATABASE_URL`          | Atlas connection for the post-deploy catalogue sync; separate from the Worker's secret of the same name                                                     |

One repository variable, `SYNC_SCHEMA_INDEXES`, opts the post-deploy job into pushing the schema's
indexes. Set it to `true` only while Atlas has no duplicates for any schema unique index.

After deployment, `sync-catalogue` runs `pnpm db:generate && pnpm db:sync`. If the repository's `DATABASE_URL`
secret is missing, that job warns and skips the sync; a green deploy alone does not prove the
catalogue was updated. Follow [seeding vs syncing](../packages/database/README.md#seeding-vs-syncing)
for manual publication or schema-shape changes. `db:seed` and `db:reset` are local-only.
The first admin: sign up through the storefront, then run `db:role` with the Atlas prefix as
[roles](../packages/database/README.md#roles) shows; no page grants the role.

The same job then runs `pnpm db:indexes` when `SYNC_SCHEMA_INDEXES` is `true`, and warns and skips
otherwise. It checks for duplicates read-only and pushes only if none are found. The push then
creates every schema index Atlas lacks and drops every index the schema does not declare. It changes
no documents. A failed check lists the duplicate documents by `_id` only, and a failed push's own
output is withheld, so the job log never carries key values. Resolve the documents and rerun the
job. A
schema index change reaches production this way, after the deploy that ships it. See
[indexes](../packages/database/README.md#indexes) before adding a unique index or creating one by
hand in Atlas.

## Check a branch locally

There is no configured pull-request preview. Check the assets and container together with Docker
running:

1. Start the local database with `pnpm db:up` and build with `pnpm build`.
2. Copy `apps/server/.dev.vars.example` to `apps/server/.dev.vars` if needed. This uses the Docker
   host database and `NODE_ENV=test`; the production image does not contain `pino-pretty`, so
   development logging is unsuitable for this path.
3. Run `pnpm --filter server exec wrangler dev` from the repository root; `apps/server` has the
   equivalent `dev:worker` script.

Wrangler serves the last built client assets. Rebuild after changing them. Local branch checks
do not replace the [E2E suite](../apps/e2e/README.md).

## Manual deployment and recovery

The fallback from the repository root is `pnpm deploy:app`. It needs Docker and either a local
Wrangler login (`pnpm --filter server exec wrangler login`) or deployment credentials in the
environment. It does not run the CI checks or the post-deploy catalogue sync for you: use the
[verification guide](agents/verification.md) and complete the sync when required.

After deployment, check `/api/v1/health`, a product deep link, an image, and sign-in/cart behavior
at the deployed hostname. Confirm the workflow's catalogue sync completed or arrange the manual
sync described above.

There is no automated rollback job in this repository. Recover code through a reviewed revert
on `main`, which follows the same checks and deployment pipeline. Before reverting a change that
altered persisted data, confirm the reverted reader accepts the current shape: reverting code
does not undo a catalogue sync, and reseeding production is not a recovery procedure.

## Provision another instance

Use a Cloudflare account with Containers enabled, an Atlas database/user, and an R2 bucket with
a public custom domain. Configure the Worker secrets and plain values above, set `MEDIA_BASE_URL`
to the bucket hostname, publish media using the [media guide](../packages/media/README.md), and
deploy. Attach the application's custom domain to the Worker; the API uses that same hostname.
The Worker's custom domain and the bucket's custom domain are configured in the Cloudflare
dashboard and are not recorded in `apps/server/wrangler.jsonc`, so a fresh clone cannot read them
from the repo.
For automatic deploys from a fork, configure all three repository secrets above and use the
committed workflow.

The old `audiophile-client-i8rq.onrender.com` hostname only redirects to the current application.
Its host configuration is external to this repository; [`render/moved/index.html`](../render/moved/index.html)
is the committed redirect page retained for existing links.
