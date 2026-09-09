import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listAssetKeys } from "../src/assets.js";
import { checkMedia, describeMediaCheck } from "../src/check.js";
import { MEDIA_BASE_URL } from "../src/keys.js";
import { seedImageUrls, seedReferencedKeys } from "../src/seed-references.js";

/** A throwaway assets tree holding empty files at the given keys. */
const treeOf = async (keys: readonly string[]) => {
  const dir = await mkdtemp(path.join(tmpdir(), "media-check-"));
  for (const key of keys) {
    const file = path.join(dir, ...key.split("/"));
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, "");
  }
  return dir;
};

describe("the real assets tree", () => {
  it("backs every image the seed references, with nothing left over", async () => {
    const result = checkMedia(await listAssetKeys(), seedReferencedKeys());

    expect(describeMediaCheck(result)).toBe("");
  });

  it("serves every seed image from the media host", () => {
    const urls = seedImageUrls();

    expect(urls.length).toBeGreaterThan(0);
    expect(urls.filter((url) => !url.startsWith(`${MEDIA_BASE_URL}/`))).toEqual(
      [],
    );
  });
});

describe("checkMedia", () => {
  it("reports a referenced file that is not there", async () => {
    const dir = await treeOf(["products/zx7-speaker/thumbnail.jpg"]);

    const result = checkMedia(await listAssetKeys(dir), [
      "products/zx7-speaker/thumbnail.jpg",
      "products/zx9-speaker/thumbnail.jpg",
    ]);

    expect(result).toEqual({
      missing: ["products/zx9-speaker/thumbnail.jpg"],
      unreferenced: [],
    });
    expect(describeMediaCheck(result)).toContain("missing:");
  });

  it("reports a file nothing references", async () => {
    const dir = await treeOf([
      "products/zx7-speaker/thumbnail.jpg",
      "products/zx7-speaker/orphan.jpg",
    ]);

    const result = checkMedia(await listAssetKeys(dir), [
      "products/zx7-speaker/thumbnail.jpg",
    ]);

    expect(result).toEqual({
      missing: [],
      unreferenced: ["products/zx7-speaker/orphan.jpg"],
    });
    expect(describeMediaCheck(result)).toContain("orphan:");
  });

  it("ignores the dotfiles macOS leaves in image folders", async () => {
    const dir = await treeOf([
      "products/zx7-speaker/thumbnail.jpg",
      "products/zx7-speaker/.DS_Store",
    ]);

    expect(await listAssetKeys(dir)).toEqual([
      "products/zx7-speaker/thumbnail.jpg",
    ]);
  });
});
