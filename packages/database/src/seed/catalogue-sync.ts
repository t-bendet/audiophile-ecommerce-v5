import { prisma } from "../client.js";
import { categoryData, type CategoryName } from "./categories.seed.js";
import {
  earphonesProductData,
  headphonesProductData,
  speakersProductData,
  type ProductCreateWithoutCategoryInput,
} from "./products.seed.js";

/**
 * The catalogue the repo owns - categories, products, config - written onto
 * whatever database DATABASE_URL names, without dropping anything.
 *
 * Every write is an upsert on an existing unique key, so a document keeps its
 * `_id` and the `productId` in someone's cart or order history stays valid.
 * Nothing is deleted and no user is touched: a product dropped from the repo
 * is left in place, because removing it would cascade away cart items and
 * dangle order items. Re-running it changes nothing.
 */

const CATALOGUE: readonly (readonly [
  CategoryName,
  readonly ProductCreateWithoutCategoryInput[],
])[] = [
  ["Headphones", headphonesProductData],
  ["Earphones", earphonesProductData],
  ["Speakers", speakersProductData],
];

// The config names the products it points at; slugs are stable, names are the
// column the seed literals key on.
const CONFIG_SLOTS = {
  featuredProductId: "xx99-mark-two-headphones",
  showCaseCoverId: "zx9-speaker",
  showCaseWideId: "zx7-speaker",
  showCaseGridId: "yx1-wireless-earphones",
} as const;

const syncCategories = async () => {
  const ids = new Map<CategoryName, string>();

  for (const { name, thumbnail } of categoryData) {
    const category = await prisma.category.upsert({
      where: { name },
      create: { name, thumbnail },
      update: { thumbnail },
    });
    ids.set(category.name, category.id);
  }

  console.log(`categories: ${ids.size} in sync`);
  return ids;
};

const syncProducts = async (categoryIds: Map<CategoryName, string>) => {
  const ids = new Map<string, string>();

  for (const [categoryName, products] of CATALOGUE) {
    const categoryId = categoryIds.get(categoryName);
    if (!categoryId)
      throw new Error(`No category was synced for ${categoryName}`);

    for (const { slug, ...fields } of products) {
      const product = await prisma.product.upsert({
        where: { slug },
        create: { ...fields, slug, category: { connect: { id: categoryId } } },
        update: { ...fields, category: { connect: { id: categoryId } } },
      });
      ids.set(product.slug, product.id);
    }
  }

  console.log(`products: ${ids.size} in sync`);
  return ids;
};

const syncConfig = async (productIds: Map<string, string>) => {
  const slots = Object.fromEntries(
    Object.entries(CONFIG_SLOTS).map(([slot, slug]) => {
      const id = productIds.get(slug);
      if (!id) throw new Error(`Config slot ${slot} wants a missing ${slug}`);
      return [slot, id];
    }),
  ) as Record<keyof typeof CONFIG_SLOTS, string>;

  const name = "productsConfig";
  await prisma.config.upsert({
    where: { name },
    create: { name, ...slots },
    update: slots,
  });

  console.log("config: 1 in sync");
};

export const syncCatalogue = async () => {
  await syncConfig(await syncProducts(await syncCategories()));
};
