import { readdir } from "node:fs/promises";
import path from "node:path";
import { ASSETS_DIR } from "./keys.js";

/**
 * Every file under `dir` as a bucket key: a "/"-joined path relative to the
 * root, with dotfiles (macOS drops `.DS_Store` into image folders) left out.
 */
export const listAssetKeys = async (dir: string = ASSETS_DIR) => {
  const entries = await readdir(dir, {
    recursive: true,
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
    .map((entry) =>
      path
        .relative(dir, path.join(entry.parentPath, entry.name))
        .split(path.sep)
        .join("/"),
    )
    .sort();
};
