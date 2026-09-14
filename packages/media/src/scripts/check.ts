import { auditAssets } from "../audit.js";
import { buildManifest, writeManifest } from "../manifest.js";
import { seedImageReferences, seedReferencedKeys } from "../seed-references.js";

/**
 * `media:check` — the assets tree against the seed references and the
 * committed manifest. `--write` regenerates the manifest instead of failing on
 * it. No network, no database.
 */

const main = async () => {
  if (process.argv.includes("--write")) {
    const manifest = await buildManifest();
    await writeManifest(manifest);
    console.log(
      `manifest.json rewritten: ${Object.keys(manifest).length} files.`,
    );
    return;
  }

  const referencedKeys = seedReferencedKeys();
  const references = seedImageReferences();
  const { manifest, report } = await auditAssets({
    referencedKeys,
    references,
  });

  if (report !== "") {
    console.error(report);
    console.error(
      "\nIf the tree is right, `pnpm --filter @repo/media media:check --write` " +
        "brings the manifest with it.",
    );
    process.exit(1);
  }

  console.log(
    `${Object.keys(manifest).length} files, manifest current, ` +
      `${references.length} references checked against their file's pixel size.`,
  );
};

await main();
