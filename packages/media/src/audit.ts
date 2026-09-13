import {
  checkMedia,
  describeMediaCheck,
  type ImageReference,
} from "./check.js";
import {
  buildManifest,
  checkManifest,
  describeManifestCheck,
  readManifest,
  type Manifest,
} from "./manifest.js";

/** Everything `media:check` holds the tree to; `report` is empty when sound. */
export const auditAssets = async ({
  referencedKeys,
  references,
  dir,
  manifestFile,
}: {
  referencedKeys: readonly string[];
  references: readonly ImageReference[];
  dir?: string;
  manifestFile?: string;
}): Promise<{ manifest: Manifest; report: string }> => {
  const manifest = await buildManifest(dir);

  return {
    manifest,
    report: [
      describeMediaCheck(
        checkMedia(Object.keys(manifest), referencedKeys, {
          references,
          actual: manifest,
        }),
      ),
      describeManifestCheck(
        checkManifest(await readManifest(manifestFile), manifest),
      ),
    ]
      .filter((section) => section !== "")
      .join("\n"),
  };
};
