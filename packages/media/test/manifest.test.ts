import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ASSETS_DIR } from "../src/keys.js";
import {
  MANIFEST_PATH,
  buildManifest,
  checkManifest,
  describeManifestCheck,
  serializeManifest,
  type Manifest,
} from "../src/manifest.js";
import { EARPHONES, HEADPHONES, imageTreeOf } from "./helpers.js";

describe("the committed manifest", () => {
  it("is what the assets tree regenerates, byte for byte", async () => {
    const current = serializeManifest(await buildManifest());

    expect(current).toBe(await readFile(MANIFEST_PATH, "utf8"));
  });
});

describe("buildManifest", () => {
  it("records the bytes, hash and pixel size of every file", async () => {
    const dir = await imageTreeOf({ "categories/a/thumbnail.png": EARPHONES });
    const source = await readFile(path.join(ASSETS_DIR, EARPHONES));

    expect(await buildManifest(dir)).toEqual({
      "categories/a/thumbnail.png": {
        bytes: (await stat(path.join(ASSETS_DIR, EARPHONES))).size,
        sha256: createHash("sha256").update(source).digest("hex"),
        width: 438,
        height: 380,
      },
    });
  });

  it("lists keys in sorted order whatever the tree hands back", async () => {
    const dir = await imageTreeOf({
      "categories/z/thumbnail.png": EARPHONES,
      "categories/a/thumbnail.png": HEADPHONES,
    });

    expect(Object.keys(await buildManifest(dir))).toEqual([
      "categories/a/thumbnail.png",
      "categories/z/thumbnail.png",
    ]);
  });

  it("names the file it cannot read a pixel size from", async () => {
    const dir = await imageTreeOf({});
    const file = path.join(dir, "categories", "a", "thumbnail.png");
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, "not an image");

    await expect(buildManifest(dir)).rejects.toThrow(
      "categories/a/thumbnail.png",
    );
  });
});

describe("serializeManifest", () => {
  it("ends with a newline and indents two spaces", async () => {
    const dir = await imageTreeOf({ "categories/a/thumbnail.png": EARPHONES });

    const text = serializeManifest(await buildManifest(dir));

    expect(text.endsWith("}\n")).toBe(true);
    expect(text).toContain(
      '\n  "categories/a/thumbnail.png": {\n    "bytes": ',
    );
  });

  it("is reproducible from the same tree", async () => {
    const dir = await imageTreeOf({
      "categories/z/thumbnail.png": EARPHONES,
      "categories/a/thumbnail.png": HEADPHONES,
    });

    expect(serializeManifest(await buildManifest(dir))).toBe(
      serializeManifest(await buildManifest(dir)),
    );
  });
});

describe("checkManifest", () => {
  const entry = { bytes: 1, sha256: "a", width: 2, height: 3 };
  const committed: Manifest = { "categories/a/thumbnail.png": entry };

  it("passes when the manifest is the tree", () => {
    const result = checkManifest(committed, { ...committed });

    expect(result).toEqual({ added: [], removed: [], changed: [] });
    expect(describeManifestCheck(result)).toBe("");
  });

  it("reports a file the manifest does not list", () => {
    const result = checkManifest(committed, {
      ...committed,
      "categories/b/thumbnail.png": entry,
    });

    expect(result.added).toEqual(["categories/b/thumbnail.png"]);
    expect(describeManifestCheck(result)).toContain(
      "categories/b/thumbnail.png",
    );
  });

  it("reports an entry whose file is gone", () => {
    const result = checkManifest(committed, {});

    expect(result.removed).toEqual(["categories/a/thumbnail.png"]);
  });

  it("reports an entry whose file changed", () => {
    const result = checkManifest(committed, {
      "categories/a/thumbnail.png": { ...entry, sha256: "b" },
    });

    expect(result.changed).toEqual(["categories/a/thumbnail.png"]);
  });

  it("reports a pixel size that changed under the same bytes", () => {
    const result = checkManifest(committed, {
      "categories/a/thumbnail.png": { ...entry, height: 4 },
    });

    expect(result.changed).toEqual(["categories/a/thumbnail.png"]);
  });
});
