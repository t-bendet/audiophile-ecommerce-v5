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
 * Each document is keyed on an existing unique key (`Category.name`,
 * `Product.slug`, `Config.name`). A document whose key is missing is created;
 * one that exists is left exactly as it is, because the database owns the
 * catalogue once it has been published and an admin may have edited it since
 * (ADR 0007). `overwrite` restores the full upsert for a hand-run shape
 * change. Either way a document keeps its `_id`, so the `productId` in
 * someone's cart or order history stays valid; nothing is deleted and no user
 * is touched. Re-running it changes nothing.
 */

export type SyncOptions = {
  /** Rewrite every field of an existing document from the repo's copy. */
  overwrite?: boolean;
};

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

type Tally = { created: number; kept: number; overwritten: number };

const report = (model: string, { created, kept, overwritten }: Tally) => {
  const parts = [`${created} created`];
  if (overwritten) parts.push(`${overwritten} overwritten`);
  if (kept) parts.push(`${kept} kept`);
  console.log(`${model}: ${parts.join(", ")}`);
};

/**
 * One document: created when its key is missing, otherwise kept as it is or,
 * with `overwrite`, rewritten. Returns the stored document either way.
 */
const writeByKey = async <T>(
  tally: Tally,
  overwrite: boolean,
  find: () => Promise<T | null>,
  create: () => Promise<T>,
  update: () => Promise<T>,
): Promise<T> => {
  const existing = await find();
  if (!existing) {
    tally.created++;
    return create();
  }
  if (overwrite) {
    tally.overwritten++;
    return update();
  }
  tally.kept++;
  return existing;
};

const syncCategories = async (overwrite: boolean) => {
  const ids = new Map<CategoryName, string>();
  const tally: Tally = { created: 0, kept: 0, overwritten: 0 };

  for (const { name, thumbnail } of categoryData) {
    const category = await writeByKey(
      tally,
      overwrite,
      () => prisma.category.findUnique({ where: { name } }),
      () => prisma.category.create({ data: { name, thumbnail } }),
      () => prisma.category.update({ where: { name }, data: { thumbnail } }),
    );
    ids.set(category.name, category.id);
  }

  report("categories", tally);
  return ids;
};

const syncProducts = async (
  categoryIds: Map<CategoryName, string>,
  overwrite: boolean,
) => {
  const ids = new Map<string, string>();
  const tally: Tally = { created: 0, kept: 0, overwritten: 0 };

  for (const [categoryName, products] of CATALOGUE) {
    const categoryId = categoryIds.get(categoryName);
    if (!categoryId)
      throw new Error(`No category was synced for ${categoryName}`);

    for (const { slug, ...fields } of products) {
      const category = { connect: { id: categoryId } };
      const product = await writeByKey(
        tally,
        overwrite,
        () => prisma.product.findUnique({ where: { slug } }),
        () => prisma.product.create({ data: { ...fields, slug, category } }),
        () =>
          prisma.product.update({
            where: { slug },
            data: { ...fields, category },
          }),
      );
      ids.set(product.slug, product.id);
    }
  }

  report("products", tally);
  return ids;
};

const syncConfig = async (
  productIds: Map<string, string>,
  overwrite: boolean,
) => {
  const tally: Tally = { created: 0, kept: 0, overwritten: 0 };
  const slots = Object.fromEntries(
    Object.entries(CONFIG_SLOTS).map(([slot, slug]) => {
      const id = productIds.get(slug);
      if (!id) throw new Error(`Config slot ${slot} wants a missing ${slug}`);
      return [slot, id];
    }),
  ) as Record<keyof typeof CONFIG_SLOTS, string>;

  const name = "productsConfig";
  await writeByKey(
    tally,
    overwrite,
    () => prisma.config.findUnique({ where: { name } }),
    () => prisma.config.create({ data: { name, ...slots } }),
    () => prisma.config.update({ where: { name }, data: slots }),
  );

  report("config", tally);
};

export const syncCatalogue = async ({
  overwrite = false,
}: SyncOptions = {}) => {
  const categoryIds = await syncCategories(overwrite);
  const productIds = await syncProducts(categoryIds, overwrite);
  await syncConfig(productIds, overwrite);
};
