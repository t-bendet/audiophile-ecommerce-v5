import { prisma, type NAME } from "@repo/database";
import { categoryData } from "@repo/database/seed/categories";
import {
  earphonesProductData,
  headphonesProductData,
  speakersProductData,
} from "@repo/database/seed/products";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import { resetDatabase } from "./helpers/database.js";

/**
 * The catalogue literals the production seed inserts, served through the real
 * app. Stage 1 of the Cloudflare move (#204) put every image on the media host,
 * so this is what stops an ibb.co URL — or any other host — coming back.
 */

const MEDIA_PREFIX = "https://audiophile-media.t-bendet.com/";

const CATALOGUE: readonly (readonly [NAME, typeof headphonesProductData])[] = [
  ["Headphones", headphonesProductData],
  ["Earphones", earphonesProductData],
  ["Speakers", speakersProductData],
];

const seedCatalogue = async () => {
  const categoryIds = new Map<NAME, string>();
  for (const category of categoryData) {
    const created = await prisma.category.create({ data: category });
    categoryIds.set(created.name, created.id);
  }

  for (const [name, products] of CATALOGUE) {
    for (const product of products) {
      await prisma.product.create({
        data: {
          ...product,
          category: { connect: { id: categoryIds.get(name) } },
        },
      });
    }
  }
};

/** Every `src` / `*Src` string anywhere in a response body. */
const imageUrls = (value: unknown, found: string[] = []): string[] => {
  if (Array.isArray(value)) {
    for (const item of value) imageUrls(item, found);
    return found;
  }
  if (value === null || typeof value !== "object") return found;

  for (const [name, nested] of Object.entries(value)) {
    if (typeof nested === "string") {
      if (name === "src" || name.endsWith("Src")) found.push(nested);
    } else {
      imageUrls(nested, found);
    }
  }
  return found;
};

beforeEach(async () => {
  await resetDatabase();
  await seedCatalogue();
});

describe("catalogue image URLs", () => {
  it.for([
    ["/api/v1/products", 126],
    ["/api/v1/categories", 3],
  ] as const)("serves %s from the media host", async ([path, expected]) => {
    const res = await request(app).get(path);

    expect(res.status).toBe(200);

    const urls = imageUrls(res.body.data);
    expect(urls).toHaveLength(expected);
    expect(urls.filter((url) => !url.startsWith(MEDIA_PREFIX))).toEqual([]);
    expect(urls.filter((url) => url.includes("ibb.co"))).toEqual([]);
  });
});
