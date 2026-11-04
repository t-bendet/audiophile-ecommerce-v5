// Resolves tags in the Cloudflare registry to manifest digests, one `<tag>\t<digest>`
// line per argument and `-` for a tag the registry does not hold. `wrangler containers
// images list` prints tags without digests; the registry's manifest HEAD carries one,
// read with the short-lived pull credential wrangler itself requests.
const REGISTRY = "registry.cloudflare.com";
const API = "https://api.cloudflare.com/client/v4";
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const TAG = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/;

const token = requireEnv("CLOUDFLARE_API_TOKEN", /^\S+$/);
const accountId = requireEnv("CLOUDFLARE_ACCOUNT_ID", /^[a-f0-9]{32}$/);
const repository = requireEnv("CONTAINER_IMAGE", /^[a-z0-9]+(?:[._-]+[a-z0-9]+)*$/);

const tags = process.argv.slice(2);
if (tags.length === 0) fail("usage: resolve-image-digests.mjs <tag>...");
for (const tag of tags) if (!TAG.test(tag)) fail(`'${tag}' is not an image tag`);

const credentials = await pullCredentials();
for (const tag of tags) console.log(`${tag}\t${await digestOf(tag)}`);

async function pullCredentials() {
  const response = await fetch(`${API}/accounts/${accountId}/containers/registries/${REGISTRY}/credentials`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expiration_minutes: 5, permissions: ["pull"] }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success) {
    fail(`registry credentials: ${response.status} ${response.statusText} ${JSON.stringify(body.errors ?? [])}`);
  }
  return Buffer.from(`${body.result.username}:${body.result.password}`).toString("base64");
}

async function digestOf(tag) {
  const response = await fetch(`https://${REGISTRY}/v2/${accountId}/${repository}/manifests/${tag}`, {
    method: "HEAD",
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: "application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json",
    },
  });
  if (response.status === 404) return "-";
  const digest = response.headers.get("docker-content-digest") ?? "";
  if (!response.ok || !DIGEST.test(digest)) {
    fail(`${repository}:${tag}: ${response.status} ${response.statusText}, digest '${digest}'`);
  }
  return digest;
}

function requireEnv(name, shape) {
  const value = process.env[name] ?? "";
  if (!shape.test(value)) fail(`${name} must match ${shape}`);
  return value;
}

function fail(message) {
  console.error(`resolve-image-digests: ${message}`);
  process.exit(1);
}
