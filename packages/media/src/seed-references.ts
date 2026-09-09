import { categoryData } from "@repo/database/seed/categories";
import {
  earphonesProductData,
  headphonesProductData,
  speakersProductData,
} from "@repo/database/seed/products";
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
