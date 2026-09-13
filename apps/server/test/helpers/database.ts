import {
  prisma,
  type Category,
  type ImageVariant,
  type NAME,
  type ResponsiveImage,
  type SingleImage,
} from "@repo/database";
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

/** A genuinely signed JWT whose expiry has already passed. */
export const expiredAuthCookie = (userId: string) => {
  const token = jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: "-1s" });
  return `jwt=${token}`;
};

/** A well-formed JWT signed with the wrong secret. */
export const tamperedAuthCookie = (userId: string) => {
  const token = jwt.sign({ id: userId }, `${env.JWT_SECRET}-wrong`);
  return `jwt=${token}`;
};

/** A persisted responsive image: one key per breakpoint, each its own size. */
export const responsiveImage = (slug: string, role: string) => ({
  altText: `${slug} ${role} alt`,
  mobile: {
    key: `products/${slug}/${role}-mobile.jpg`,
    width: 654,
    height: 654,
  },
  tablet: {
    key: `products/${slug}/${role}-tablet.jpg`,
    width: 562,
    height: 960,
  },
  desktop: {
    key: `products/${slug}/${role}-desktop.jpg`,
    width: 1080,
    height: 1120,
  },
});

/** A persisted single image: a bucket key and the size of the file behind it. */
export const singleImage = (slug: string) => ({
  altText: `${slug} alt`,
  image: { key: `categories/${slug}/thumbnail.png`, width: 438, height: 422 },
});

/** The same shape under the products prefix; `slug` is a bucket path segment. */
export const thumbnail = (slug: string) => ({
  altText: `${slug} alt`,
  image: { key: `products/${slug}/thumbnail.jpg`, width: 150, height: 150 },
});

/** What a stored image becomes on the wire: the key joined onto the host. */
export const resolvedVariant = ({ key, width, height }: ImageVariant) => ({
  src: `https://audiophile-media.t-bendet.com/${key}`,
  width,
  height,
});

/** The same, with the alt text the field carries alongside it. */
export const resolvedImage = ({ altText, image }: SingleImage) => ({
  altText,
  ...resolvedVariant(image),
});

/** Three resolved variants under one description. */
export const resolvedResponsiveImage = ({
  altText,
  mobile,
  tablet,
  desktop,
}: ResponsiveImage) => ({
  altText,
  mobile: resolvedVariant(mobile),
  tablet: resolvedVariant(tablet),
  desktop: resolvedVariant(desktop),
});

export const createCategory = (name: NAME = "Headphones"): Promise<Category> =>
  prisma.category.create({
    data: { name, thumbnail: singleImage(name.toLowerCase()) },
  });

export const createProduct = async (
  overrides: {
    categoryId?: string;
    price?: number;
    slug?: string;
    featuredImageText?: string;
  } = {},
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
      featuredImageText: overrides.featuredImageText ?? null,
      showCaseImageText: null,
      includedItems: [{ item: "Cable", quantity: 1 }],
      images: {
        galleryImages: [responsiveImage(label, "gallery-1")],
        introImage: responsiveImage(label, "intro"),
        primaryImage: responsiveImage(label, "primary"),
        relatedProductImage: responsiveImage(label, "related"),
        featuredImage: responsiveImage(label, "featured"),
        showCaseImage: responsiveImage(label, "showcase"),
        thumbnail: thumbnail(label),
      },
    },
  });
};

/** The singleton config row, with a distinct product behind each slot. */
export const createConfig = async () => {
  const categoryId = await sharedCategoryId();
  const [featured, cover, grid, wide] = await Promise.all([
    // The featured slot is served only when the product carries its own text.
    createProduct({ categoryId, featuredImageText: "featured text" }),
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
