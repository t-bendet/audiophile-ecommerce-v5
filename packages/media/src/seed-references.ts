import { categoryData } from "@repo/database/seed/categories";
import {
  earphonesProductData,
  headphonesProductData,
  speakersProductData,
} from "@repo/database/seed/products";
import type { ImageReference } from "./check.js";
import { keyForUrl } from "./keys.js";

/**
 * Any `src` / `*Src` string anywhere in the seed literals. Walking the shape
 * rather than naming the image fields means a new one is covered the day it is
 * added.
 */
const collectImageUrls = (value: unknown, found: string[]) => {
  if (Array.isArray(value)) {
    for (const item of value) collectImageUrls(item, found);
    return found;
  }
  if (value === null || typeof value !== "object") return found;

  for (const [name, nested] of Object.entries(value)) {
    if (typeof nested === "string") {
      if (name === "src" || name.endsWith("Src")) found.push(nested);
    } else {
      collectImageUrls(nested, found);
    }
  }
  return found;
};

export const seedImageUrls = () =>
  collectImageUrls(
    [
      categoryData,
      headphonesProductData,
      earphonesProductData,
      speakersProductData,
    ],
    [],
  );

/** The bucket keys the seed asks for. Throws on a URL off the media host. */
export const seedReferencedKeys = () => [
  ...new Set(seedImageUrls().map(keyForUrl)),
];

/**
 * Any `{ key, width, height }` anywhere in the seed literals - empty until an
 * entity migrates off URL literals. A key without both dimensions throws
 * rather than going unchecked, so a half-migrated entity cannot pass quietly.
 */
export const collectImageReferences = (
  value: unknown,
  found: ImageReference[],
) => {
  if (Array.isArray(value)) {
    for (const item of value) collectImageReferences(item, found);
    return found;
  }
  if (value === null || typeof value !== "object") return found;

  const { key, width, height } = value as Partial<ImageReference>;
  if (typeof key === "string") {
    if (typeof width !== "number" || typeof height !== "number")
      throw new Error(`${key} is referenced without a width and a height`);

    found.push({ key, width, height });
    return found;
  }

  for (const nested of Object.values(value)) {
    collectImageReferences(nested, found);
  }
  return found;
};

/** The dimensions the seed states, for `media:check` to hold to the files. */
export const seedImageReferences = () =>
  collectImageReferences(
    [
      categoryData,
      headphonesProductData,
      earphonesProductData,
      speakersProductData,
    ],
    [],
  );
