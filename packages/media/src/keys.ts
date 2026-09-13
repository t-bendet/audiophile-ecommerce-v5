import { fileURLToPath } from "node:url";

/** Every catalogue image is served from this host; see docs/adr/0005. */
export const MEDIA_BASE_URL = "https://audiophile-media.t-bendet.com";

/** The repo-owned originals, one file per bucket key. */
export const ASSETS_DIR = fileURLToPath(new URL("../assets/", import.meta.url));

// Only what `assets/` actually holds; a new format has to be added here, which
// is the point - an unrecognised extension should stop the sync, not guess.
const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
};

export const contentTypeForKey = (key: string) => {
  const extension = key.slice(key.lastIndexOf(".")).toLowerCase();
  const type = CONTENT_TYPES[extension];
  if (!type) throw new Error(`No content type is registered for ${key}`);
  return type;
};
