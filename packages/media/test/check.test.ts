import { copyFile, mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listAssetKeys } from "../src/assets.js";
import { auditAssets } from "../src/audit.js";
import { checkMedia, describeMediaCheck } from "../src/check.js";
import { MEDIA_BASE_URL } from "../src/keys.js";
import { buildManifest, writeManifest } from "../src/manifest.js";
import {
  collectImageReferences,
  seedImageReferences,
  seedImageUrls,
  seedReferencedKeys,
} from "../src/seed-references.js";
import { EARPHONES, emptyTreeOf, imageTreeOf } from "./helpers.js";

describe("the real assets tree", () => {
  it("backs every image the seed references, with nothing left over", async () => {
    const result = checkMedia(await listAssetKeys(), seedReferencedKeys(), {
      references: seedImageReferences(),
      actual: await buildManifest(),
    });

    expect(describeMediaCheck(result)).toBe("");
  });

  it("asks for the keys a migrated entity states, not only the URLs", () => {
    const references = seedImageReferences();

    expect(references.length).toBeGreaterThan(0);
    expect(seedReferencedKeys()).toEqual(
      expect.arrayContaining(references.map(({ key }) => key)),
    );
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
    const dir = await emptyTreeOf(["products/zx7-speaker/thumbnail.jpg"]);

    const result = checkMedia(await listAssetKeys(dir), [
      "products/zx7-speaker/thumbnail.jpg",
      "products/zx9-speaker/thumbnail.jpg",
    ]);

    expect(result).toEqual({
      missing: ["products/zx9-speaker/thumbnail.jpg"],
      unreferenced: [],
      mismatched: [],
    });
    expect(describeMediaCheck(result)).toContain("missing:");
  });

  it("reports a file nothing references", async () => {
    const dir = await emptyTreeOf([
      "products/zx7-speaker/thumbnail.jpg",
      "products/zx7-speaker/orphan.jpg",
    ]);

    const result = checkMedia(await listAssetKeys(dir), [
      "products/zx7-speaker/thumbnail.jpg",
    ]);

    expect(result).toEqual({
      missing: [],
      unreferenced: ["products/zx7-speaker/orphan.jpg"],
      mismatched: [],
    });
    expect(describeMediaCheck(result)).toContain("orphan:");
  });

  it("ignores the dotfiles macOS leaves in image folders", async () => {
    const dir = await emptyTreeOf([
      "products/zx7-speaker/thumbnail.jpg",
      "products/zx7-speaker/.DS_Store",
    ]);

    expect(await listAssetKeys(dir)).toEqual([
      "products/zx7-speaker/thumbnail.jpg",
    ]);
  });
});

describe("checkMedia with a dimensions source", () => {
  const key = EARPHONES;

  it("reports a reference whose size is not the file's", async () => {
    const dir = await imageTreeOf({ [key]: EARPHONES });

    const result = checkMedia(await listAssetKeys(dir), [key], {
      references: [{ key, width: 438, height: 999 }],
      actual: await buildManifest(dir),
    });

    expect(result.mismatched).toEqual([
      {
        key,
        referenced: { width: 438, height: 999 },
        actual: { width: 438, height: 380 },
      },
    ]);
    expect(describeMediaCheck(result)).toContain(
      "referenced as 438x999 but the file is 438x380",
    );
  });

  it("passes when the reference is the file's real size", async () => {
    const dir = await imageTreeOf({ [key]: EARPHONES });

    const result = checkMedia(await listAssetKeys(dir), [key], {
      references: [{ key, width: 438, height: 380 }],
      actual: await buildManifest(dir),
    });

    expect(describeMediaCheck(result)).toBe("");
  });

  it("leaves a reference with no file to the missing report", async () => {
    const dir = await imageTreeOf({});

    const result = checkMedia(await listAssetKeys(dir), [key], {
      references: [{ key, width: 438, height: 999 }],
      actual: await buildManifest(dir),
    });

    expect(result).toEqual({
      missing: [key],
      unreferenced: [],
      mismatched: [],
    });
  });

  it("checks nothing when no dimensions source is given", async () => {
    const dir = await imageTreeOf({ [key]: EARPHONES });

    expect(checkMedia(await listAssetKeys(dir), [key]).mismatched).toEqual([]);
  });
});

describe("collectImageReferences", () => {
  it("finds every object that states a key with both dimensions", () => {
    const seedShape = {
      thumbnail: {
        altText: "Earphones",
        image: {
          key: "categories/earphones/thumbnail.png",
          width: 438,
          height: 380,
        },
      },
      gallery: [
        {
          mobile: {
            key: "products/a/gallery-1-mobile.jpg",
            width: 1,
            height: 2,
          },
        },
      ],
      legacy: { src: "https://example.test/still-a-url.jpg" },
    };

    expect(collectImageReferences(seedShape, [])).toEqual([
      { key: "categories/earphones/thumbnail.png", width: 438, height: 380 },
      { key: "products/a/gallery-1-mobile.jpg", width: 1, height: 2 },
    ]);
  });

  it("refuses a key that states no dimensions, rather than skipping it", () => {
    expect(() =>
      collectImageReferences(
        { image: { key: "products/a/b.jpg", width: 1 } },
        [],
      ),
    ).toThrow("products/a/b.jpg is referenced without a width and a height");
  });
});

describe("auditAssets", () => {
  const key = EARPHONES;
  const pixels = { width: 438, height: 380 };

  /**
   * A temp copy of the package layout: an assets tree and, beside it, the
   * manifest a `--write` would have committed for it.
   */
  const auditable = async (files: Readonly<Record<string, string>>) => {
    const root = await mkdtemp(path.join(tmpdir(), "media-audit-"));
    const dir = path.join(root, "assets");
    await mkdir(dir, { recursive: true });
    await imageTreeOf(files, dir);

    const manifestFile = path.join(root, "manifest.json");
    await writeManifest(await buildManifest(dir), manifestFile);
    return { dir, manifestFile };
  };

  it("says nothing about a tree that is in order", async () => {
    const { dir, manifestFile } = await auditable({ [key]: EARPHONES });

    const { report } = await auditAssets({
      referencedKeys: [key],
      references: [{ key, ...pixels }],
      dir,
      manifestFile,
    });

    expect(report).toBe("");
  });

  it("fails on a manifest the tree has moved past", async () => {
    const { dir, manifestFile } = await auditable({ [key]: EARPHONES });
    const added = "categories/earphones/thumbnail-2x.png";
    await copyFile(
      path.join(dir, ...key.split("/")),
      path.join(dir, ...added.split("/")),
    );

    const { report } = await auditAssets({
      referencedKeys: [key, added],
      references: [],
      dir,
      manifestFile,
    });

    expect(report).toContain(`stale manifest: ${added} is not listed`);
  });

  it("fails on a referenced file that is not there", async () => {
    const { dir, manifestFile } = await auditable({ [key]: EARPHONES });

    const { report } = await auditAssets({
      referencedKeys: [key, "categories/speakers/thumbnail.png"],
      references: [],
      dir,
      manifestFile,
    });

    expect(report).toContain("missing: categories/speakers/thumbnail.png");
  });

  it("fails on a file nothing references", async () => {
    const { dir, manifestFile } = await auditable({ [key]: EARPHONES });

    const { report } = await auditAssets({
      referencedKeys: [],
      references: [],
      dir,
      manifestFile,
    });

    expect(report).toContain(`orphan: assets/${key}`);
  });

  it("fails on a reference whose dimensions are not the file's", async () => {
    const { dir, manifestFile } = await auditable({ [key]: EARPHONES });

    const { report } = await auditAssets({
      referencedKeys: [key],
      references: [{ key, width: 438, height: 999 }],
      dir,
      manifestFile,
    });

    expect(report).toContain(`dimensions: ${key}`);
  });
});
