import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { imageSize } from "image-size";
import { listAssetKeys } from "./assets.js";
import { ASSETS_DIR } from "./keys.js";

export type ManifestEntry = {
  bytes: number;
  sha256: string;
  width: number;
  height: number;
};

/** Every file under `assets/` by bucket key, in key order. */
export type Manifest = Record<string, ManifestEntry>;

/**
 * The committed report `media:check --write` regenerates: what the tree holds,
 * visible in a diff. A fixture and an audit trail, never a runtime input.
 */
export const MANIFEST_PATH = fileURLToPath(
  new URL("../manifest.json", import.meta.url),
);

const entryOf = (key: string, bytes: Uint8Array): ManifestEntry => {
  let size;
  try {
    size = imageSize(bytes);
  } catch (cause) {
    throw new Error(`Could not read the pixel size of ${key}`, { cause });
  }

  return {
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    width: size.width,
    height: size.height,
  };
};

export const buildManifest = async (
  dir: string = ASSETS_DIR,
): Promise<Manifest> => {
  const manifest: Manifest = {};
  // listAssetKeys sorts, and insertion order is what JSON.stringify emits.
  for (const key of await listAssetKeys(dir)) {
    manifest[key] = entryOf(key, await readFile(path.join(dir, key)));
  }
  return manifest;
};

export const serializeManifest = (manifest: Manifest) =>
  `${JSON.stringify(manifest, null, 2)}\n`;

export const readManifest = async (
  file: string = MANIFEST_PATH,
): Promise<Manifest> => JSON.parse(await readFile(file, "utf8")) as Manifest;

export const writeManifest = (
  manifest: Manifest,
  file: string = MANIFEST_PATH,
) => writeFile(file, serializeManifest(manifest));

export type ManifestCheck = {
  /** Files the manifest does not list. */
  added: string[];
  /** Entries whose file is no longer there. */
  removed: string[];
  /** Entries whose bytes, hash or pixel size no longer match the file. */
  changed: string[];
};

const sameEntry = (a: ManifestEntry, b: ManifestEntry) =>
  a.bytes === b.bytes &&
  a.sha256 === b.sha256 &&
  a.width === b.width &&
  a.height === b.height;

export const checkManifest = (
  committed: Manifest,
  tree: Manifest,
): ManifestCheck => ({
  added: Object.keys(tree)
    .filter((key) => !(key in committed))
    .sort(),
  removed: Object.keys(committed)
    .filter((key) => !(key in tree))
    .sort(),
  changed: Object.keys(tree)
    .filter((key) => key in committed && !sameEntry(committed[key], tree[key]))
    .sort(),
});

export const describeManifestCheck = ({
  added,
  removed,
  changed,
}: ManifestCheck) =>
  [
    ...added.map((key) => `stale manifest: ${key} is not listed`),
    ...removed.map(
      (key) => `stale manifest: ${key} is listed but not in assets/`,
    ),
    ...changed.map(
      (key) => `stale manifest: ${key} no longer matches the file`,
    ),
  ].join("\n");
