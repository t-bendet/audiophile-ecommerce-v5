export type MediaCheck = {
  /** Keys the seed references that no file backs. */
  missing: string[];
  /** Files under `assets/` that nothing references. */
  unreferenced: string[];
};

export const checkMedia = (
  assetKeys: readonly string[],
  referencedKeys: readonly string[],
): MediaCheck => {
  const assets = new Set(assetKeys);
  const referenced = new Set(referencedKeys);

  return {
    missing: [...referenced].filter((key) => !assets.has(key)).sort(),
    unreferenced: [...assets].filter((key) => !referenced.has(key)).sort(),
  };
};

export const describeMediaCheck = ({ missing, unreferenced }: MediaCheck) =>
  [
    ...missing.map((key) => `missing: ${key} is referenced but not in assets/`),
    ...unreferenced.map((key) => `orphan: assets/${key} is never referenced`),
  ].join("\n");
