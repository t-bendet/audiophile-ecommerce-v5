// Writes apps/server/wrangler.ci.jsonc: the committed config with the container
// pointed at the image the Server image job pushed or found, so Deploy never builds one.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const serverDir = join(dirname(fileURLToPath(import.meta.url)), "../../apps/server");
const sourcePath = join(serverDir, "wrangler.jsonc");
const targetPath = join(serverDir, "wrangler.ci.jsonc");

const accountId = requireEnv("CLOUDFLARE_ACCOUNT_ID", /^[a-f0-9]{32}$/);
const repository = requireEnv("CONTAINER_IMAGE", /^[a-z0-9]+(?:[._-]+[a-z0-9]+)*$/);
const digest = requireEnv("IMAGE_DIGEST", /^sha256:[a-f0-9]{64}$/);

const { config, error } = ts.parseConfigFileTextToJson(sourcePath, readFileSync(sourcePath, "utf8"));
if (error) fail(ts.flattenDiagnosticMessageText(error.messageText, "\n"));

const containers = config.containers ?? [];
if (containers.length !== 1) fail(`expected exactly one container in ${sourcePath}, found ${containers.length}`);
const [container] = containers;
delete container.image_build_context;
container.image = `registry.cloudflare.com/${accountId}/${repository}@${digest}`;

writeFileSync(targetPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Wrote ${targetPath}; containers[0].image is ${container.image}`);

function requireEnv(name, shape) {
  const value = process.env[name] ?? "";
  if (!shape.test(value)) fail(`${name} must match ${shape}`);
  return value;
}

function fail(message) {
  console.error(`write-ci-wrangler-config: ${message}`);
  process.exit(1);
}
