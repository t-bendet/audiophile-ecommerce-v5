import { categoryData } from "@repo/database/seed/categories";
import {
  earphonesProductData,
  headphonesProductData,
  speakersProductData,
} from "@repo/database/seed/products";
import type { ImageReference } from "./check.js";

const seedData = () => [
  categoryData,
  headphonesProductData,
  earphonesProductData,
  speakersProductData,
];

/**
 * Any `{ key, width, height }` anywhere in the seed literals. Walking the shape
 * rather than naming the image fields means a new slot is covered the day it is
 * added, and a key without both dimensions throws rather than going unchecked.
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
export const seedImageReferences = () => collectImageReferences(seedData(), []);

/** The bucket keys the seed asks for, each listed once. */
export const seedReferencedKeys = () => [
  ...new Set(seedImageReferences().map(({ key }) => key)),
];
