import { prisma, type Category, type NAME } from "@repo/database";
import jwt from "jsonwebtoken";
import { env } from "../../src/utils/env.js";

/**
 * Fixture builders for the in-memory database. Every test seeds only what it
 * needs and `resetDatabase` truncates between tests, so nothing carries over.
 */

let sequence = 0;
const unique = (prefix: string) => `${prefix}-${++sequence}`;

// Category names come from a three-value enum with a unique index, so products
// share one category unless a test asks for its own. Memoising the promise (not
// the row) keeps concurrent `createProduct` calls from racing to create it.
let sharedCategory: Promise<{ id: string }> | null = null;

const sharedCategoryId = async () => {
  sharedCategory ??= createCategory();
  return (await sharedCategory).id;
};

// Children first: MongoDB has no cascading delete on the server side.
export const resetDatabase = async () => {
  sharedCategory = null;
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.config.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
};

export const TEST_PASSWORD = "password1234";

/** A well-formed ObjectId that no fixture ever creates. */
export const ABSENT_ID = "0123456789abcdef01234567";

export const createUser = async (
  overrides: { name?: string; email?: string; role?: "ADMIN" | "USER" } = {},
) => {
  const name = overrides.name ?? unique("user");
  return prisma.user.create({
    data: {
      name,
      email: overrides.email ?? `${name}@example.com`,
      role: overrides.role ?? "USER",
      password: TEST_PASSWORD,
      passwordConfirm: TEST_PASSWORD,
    },
  });
};

export const createAdmin = (
  overrides: { name?: string; email?: string } = {},
) => createUser({ ...overrides, role: "ADMIN" });

/** The cookie header a signed-in client sends, using a genuinely signed JWT. */
export const authCookie = (userId: string) => {
  const token = jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
  return `jwt=${token}`;
};

const image = (label: string) => ({
  altText: `${label} alt`,
  ariaLabel: `${label} aria`,
  desktopSrc: `https://cdn.example.com/${label}-desktop.jpg`,
  mobileSrc: `https://cdn.example.com/${label}-mobile.jpg`,
  tabletSrc: `https://cdn.example.com/${label}-tablet.jpg`,
});

const thumbnail = (label: string) => ({
  altText: `${label} alt`,
  ariaLabel: `${label} aria`,
  src: `https://cdn.example.com/${label}-thumb.jpg`,
});

export const createCategory = (name: NAME = "Headphones"): Promise<Category> =>
  prisma.category.create({
    data: { name, thumbnail: thumbnail(name.toLowerCase()) },
  });

export const createProduct = async (
  overrides: { categoryId?: string; price?: number; slug?: string } = {},
) => {
  const categoryId = overrides.categoryId ?? (await sharedCategoryId());
  const label = unique("product");

  return prisma.product.create({
    data: {
      categoryId,
      cartLabel: label,
      name: label,
      shortLabel: label,
      slug: overrides.slug ?? label,
      description: `${label} description`,
      price: overrides.price ?? 1000,
      fullLabel: [label],
      featuresText: [`${label} feature`],
      featuredImageText: null,
      showCaseImageText: null,
      includedItems: [{ item: "Cable", quantity: 1 }],
      images: {
        galleryImages: [image(`${label}-gallery`)],
        introImage: image(`${label}-intro`),
        primaryImage: image(`${label}-primary`),
        relatedProductImage: image(`${label}-related`),
        thumbnail: thumbnail(label),
      },
    },
  });
};

/** The singleton config row, with a distinct product behind each slot. */
export const createConfig = async () => {
  const categoryId = await sharedCategoryId();
  const [featured, cover, grid, wide] = await Promise.all([
    createProduct({ categoryId }),
    createProduct({ categoryId }),
    createProduct({ categoryId }),
    createProduct({ categoryId }),
  ]);

  return prisma.config.create({
    data: {
      name: unique("config"),
      featuredProductId: featured.id,
      showCaseCoverId: cover.id,
      showCaseGridId: grid.id,
      showCaseWideId: wide.id,
    },
  });
};
