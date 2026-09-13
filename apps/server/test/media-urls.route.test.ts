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

// Spelled out rather than imported from @repo/media: the point is to pin the
// host independently of whatever the seed derives it from.
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

const collectStrings = (
  value: unknown,
  matches: (name: string) => boolean,
  found: string[] = [],
): string[] => {
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, matches, found);
    return found;
  }
  if (value === null || typeof value !== "object") return found;

  for (const [name, nested] of Object.entries(value)) {
    if (typeof nested === "string") {
      if (matches(name)) found.push(nested);
    } else {
      collectStrings(nested, matches, found);
    }
  }
  return found;
};

const isUrlField = (name: string) => name === "src" || name.endsWith("Src");

/** Every `src` / `*Src` string anywhere in a response body. */
const imageUrls = (value: unknown) => collectStrings(value, isUrlField);

/** What a seed literal asks for: a URL before migration, a key after. */
const imageReferences = (value: unknown) =>
  collectStrings(value, (name) => isUrlField(name) || name === "key");

beforeEach(async () => {
  await resetDatabase();
  await seedCatalogue();
});

describe("catalogue image URLs", () => {
  it.for([
    ["/api/v1/products", CATALOGUE.map(([, products]) => products)],
    ["/api/v1/categories", categoryData],
  ] as const)("serves %s from the media host", async ([path, seeded]) => {
    const res = await request(app).get(path);

    expect(res.status).toBe(200);

    const urls = imageUrls(res.body.data);
    expect(urls).toHaveLength(imageReferences(seeded).length);
    expect(urls.filter((url) => !url.startsWith(MEDIA_PREFIX))).toEqual([]);
    expect(urls.filter((url) => url.includes("ibb.co"))).toEqual([]);
  });
});
