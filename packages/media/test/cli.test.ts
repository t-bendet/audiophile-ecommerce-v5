import { execFile } from "node:child_process";
import { copyFile, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { ASSETS_DIR } from "../src/keys.js";
import { MANIFEST_PATH } from "../src/manifest.js";
import { EARPHONES } from "./helpers.js";

/**
 * The command itself, against the real tree: the exit codes CI reads are not
 * reachable from `auditAssets`, and `media:check` is the entry point that
 * moved in this change.
 */

const run = promisify(execFile);

const SCRIPT = fileURLToPath(
  new URL("../src/scripts/check.ts", import.meta.url),
);

const mediaCheck = (...args: string[]) =>
  run(process.execPath, ["--import", "tsx", SCRIPT, ...args]);

describe("media:check", () => {
  it("passes on the tree as committed", async () => {
    const { stdout } = await mediaCheck();

    expect(stdout).toContain("files, manifest current,");
  });

  it("exits non-zero on a file the manifest and the seed know nothing about", async () => {
    const stray = path.join(ASSETS_DIR, "categories", "earphones", "stray.png");
    await copyFile(path.join(ASSETS_DIR, EARPHONES), stray);

    try {
      await expect(mediaCheck()).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining("stale manifest:"),
      });
    } finally {
      await rm(stray);
    }
  });

  it("--write leaves the committed manifest byte for byte", async () => {
    const before = await readFile(MANIFEST_PATH, "utf8");

    const { stdout } = await mediaCheck("--write");

    expect(stdout).toContain("manifest.json rewritten");
    expect(await readFile(MANIFEST_PATH, "utf8")).toBe(before);
  });
});
