import {
  buildManifest,
  checkManifest,
  describeManifestCheck,
  readManifest,
  type Manifest,
} from "./manifest.js";

export type Pixels = { width: number; height: number };

/** What a reference claims about the file behind a bucket key. */
export type ImageReference = Pixels & { key: string };

export type DimensionMismatch = {
  key: string;
  referenced: Pixels;
  actual: Pixels;
};

/**
 * What the references claim, against the files' real pixel sizes (the
 * manifest). Optional: an entity's references only carry dimensions once it
 * has migrated off URL literals.
 */
export type DimensionsSource = {
  references: readonly ImageReference[];
  actual: Readonly<Record<string, Pixels>>;
};

export type MediaCheck = {
  /** Keys the seed references that no file backs. */
  missing: string[];
  /** Files under `assets/` that nothing references. */
  unreferenced: string[];
  /** References whose dimensions are not the file's pixel size. */
  mismatched: DimensionMismatch[];
};

const mismatchesIn = ({ references, actual }: DimensionsSource) =>
  references
    .flatMap(({ key, width, height }) => {
      // A key with no file is a `missing`, not a wrong dimension.
      const file = actual[key];
      if (!file || (file.width === width && file.height === height)) return [];

      return {
        key,
        referenced: { width, height },
        actual: { width: file.width, height: file.height },
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));

export const checkMedia = (
  assetKeys: readonly string[],
  referencedKeys: readonly string[],
  dimensions?: DimensionsSource,
): MediaCheck => {
  const assets = new Set(assetKeys);
  const referenced = new Set(referencedKeys);

  return {
    missing: [...referenced].filter((key) => !assets.has(key)).sort(),
    unreferenced: [...assets].filter((key) => !referenced.has(key)).sort(),
    mismatched: dimensions ? mismatchesIn(dimensions) : [],
  };
};

const describePixels = ({ width, height }: Pixels) => `${width}x${height}`;

export const describeMediaCheck = ({
  missing,
  unreferenced,
  mismatched,
}: MediaCheck) =>
  [
    ...missing.map((key) => `missing: ${key} is referenced but not in assets/`),
    ...unreferenced.map((key) => `orphan: assets/${key} is never referenced`),
    ...mismatched.map(
      ({ key, referenced, actual }) =>
        `dimensions: ${key} is referenced as ${describePixels(referenced)} ` +
        `but the file is ${describePixels(actual)}`,
    ),
  ].join("\n");

/**
 * Everything `media:check` holds the tree to: the seed's references, the
 * dimensions those references state, and the committed manifest. `report` is
 * empty when the tree is sound.
 */
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
