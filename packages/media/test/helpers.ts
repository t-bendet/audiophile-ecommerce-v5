import { copyFile, mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ASSETS_DIR } from "../src/keys.js";

/** Two real files, so the pixel sizes under test are not fabricated. */
export const EARPHONES = "categories/earphones/thumbnail.png"; // 438 x 380
export const HEADPHONES = "categories/headphones/thumbnail.png"; // 438 x 422

export const tempDir = (prefix: string) =>
  mkdtemp(path.join(tmpdir(), `${prefix}-`));

const fileIn = async (dir: string, key: string) => {
  const file = path.join(dir, ...key.split("/"));
  await mkdir(path.dirname(file), { recursive: true });
  return file;
};

/** A throwaway assets tree holding empty files at the given keys. */
export const emptyTreeOf = async (keys: readonly string[], root?: string) => {
  const dir = root ?? (await tempDir("media-tree"));
  for (const key of keys) await writeFile(await fileIn(dir, key), "");
  return dir;
};

/** The same, holding a copy of the named real image at each key. */
export const imageTreeOf = async (
  files: Readonly<Record<string, string>>,
  root?: string,
) => {
  const dir = root ?? (await tempDir("media-tree"));
  for (const [key, source] of Object.entries(files)) {
    await copyFile(path.join(ASSETS_DIR, source), await fileIn(dir, key));
  }
  return dir;
};
