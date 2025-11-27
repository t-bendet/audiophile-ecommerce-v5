import { PrismaClient } from "../generated/prisma/client.js";
import type { NAME } from "../generated/prisma/enums.js";
import bcrypt from "bcrypt";

const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 12);
};

// Prisma Extensions Use cases:

// Input validation before saving to DB
// Computed fields that should always exist
// Data transformations that are DB-layer concerns

// Factory function to create extended Prisma client
function createPrismaClient() {
  const client = new PrismaClient({
    omit: {
      user: { password: true, passwordConfirm: true, active: true },
    },
  })
    .$extends({
      name: "productExtensions",
      model: {
        product: {
          async getRelatedProducts(id: string) {
            const product = await client.product.findUniqueOrThrow({
              where: {
                id,
              },
              select: {
                categoryId: true,
                price: true,
              },
            });
            const relatedProducts = await client.product.findMany({
              where: {
                id: { not: id },
                OR: [
                  { categoryId: product.categoryId },
                  {
                    price: {
                      gte: product.price * 0.8,
                      lte: product.price * 1.2,
                    },
                  },
                ],
              },
              select: {
                id: true,
                shortLabel: true,
                images: {
                  select: {
                    relatedProductImage: true,
                  },
                },
                slug: true,
              },
              take: 3,
            });

            if (relatedProducts.length < 3) {
              const additionalProducts = await client.product.findMany({
                where: {
                  id: { notIn: [...relatedProducts.map((p: any) => p.id), id] },
                },
                select: {
                  id: true,
                  shortLabel: true,
                  images: {
                    select: {
                      relatedProductImage: true,
                    },
                  },
                  slug: true,
                },
                take: 3 - relatedProducts.length,
              });
              relatedProducts.push(...additionalProducts);
            }

            return relatedProducts;
          },
          async getShowCaseProducts() {
            const config = await client.config.findFirstOrThrow();

            type ShowCaseProductsKeys = keyof typeof config.showCaseProducts;

            const products = await client.product.findMany({
              where: {
                id: {
                  in: [
                    config.showCaseProducts.cover,
                    config.showCaseProducts.wide,
                    config.showCaseProducts.grid,
                  ],
                },
              },
              select: {
                shortLabel: true,
                id: true,
                categoryId: true,
                images: {
                  select: {
                    showCaseImage: true,
                  },
                },
                showCaseImageText: true,
                slug: true,
              },
            });

            const thisIsDisgusting = products.reduce(
              (
                acc: Record<ShowCaseProductsKeys, (typeof products)[number]>,
                product: (typeof products)[number]
              ) => {
                if (product.id === config.showCaseProducts.cover) {
                  return {
                    ...acc,
                    cover: product,
                  };
                }
                if (product.id === config.showCaseProducts.wide) {
                  return {
                    ...acc,
                    wide: product,
                  };
                }
                if (product.id === config.showCaseProducts.grid) {
                  return {
                    ...acc,
                    grid: product,
                  };
                }
                return acc;
              },
              {} as Record<ShowCaseProductsKeys, (typeof products)[number]>
            );

            return thisIsDisgusting;
          },
          async getFeaturedProduct() {
            const config = await client.config.findFirstOrThrow();

            const product = await client.product.findFirstOrThrow({
              where: {
                featuredImageText: { not: null },
                images: {
                  isNot: {
                    featuredImage: null,
                  },
                },
                id: config.featuredProduct,
              },
              select: {
                fullLabel: true,
                id: true,
                description: true,
                shortLabel: true,
                categoryId: true,
                featuredImageText: true,
                images: {
                  select: {
                    featuredImage: true,
                  },
                },
                isNewProduct: true,
                slug: true,
              },
            });

            return product;
          },
          async getProductsByCategory(categoryName: NAME) {
            const products = await client.product.findMany({
              where: {
                category: {
                  is: {
                    name: categoryName,
                  },
                },
              },
              select: {
                id: true,
                fullLabel: true,
                slug: true,
                images: {
                  select: {
                    introImage: true,
                  },
                },
                isNewProduct: true,
                description: true,
              },
            });
            return products;
          },
        },
      },
    })
    .$extends({
      name: "userExtensions",
      query: {
        user: {
          $allOperations(params: any) {
            const { model: _model, operation, args, query } = params;
            const findMethods = [
              "findFirst",
              "findMany",
              "findFirstOrThrow",
              "aggregate",
              "findUniqueOrThrow",
              "findUnique",
              "findMany",
            ] as const;
            type FindMethod = (typeof findMethods)[number];
            let queryArgs = args;
            if (findMethods.includes(operation as FindMethod)) {
              queryArgs = {
                ...args,
                // @ts-ignore
                ...(args.where
                  ? // @ts-ignore
                    { where: { ...args.where, active: { not: false } } }
                  : {}),
              };
            }
            return query(queryArgs);
          },
          // ** user input should be validated before this functions are called
          async create({ args, query }: any) {
            const hashedPassword = await hashPassword(args.data.password);
            args.data.password = hashedPassword;
            args.data.passwordConfirm = hashedPassword;
            return query(args);
          },
          async update({ args, query }: any) {
            // if password and password confirm exist ,iit can only be update password route
            if (args.data.password && args.data.passwordConfirm) {
              const hashedPassword = await hashPassword(
                args.data.password as string
              );
              args.data.password = hashedPassword;
              args.data.passwordConfirm = hashedPassword;
              //*  subtract 1 second, because the JWT can be created faster then saving the document,
              //* and then the changedPasswordAfter function will fail the auth process
              args.data.passwordChangedAt = new Date(Date.now() - 1000);
            }
            return query(args);
          },
          // *  soft delete all find methods will not return users marked as not active
        },
      },
      model: {
        user: {
          validatePassword: async function (
            candidatePassword: string,
            userPassword: string
          ) {
            return await bcrypt.compare(candidatePassword, userPassword);
          },
          isPasswordChangedAfter: async function (
            JWTTimestamp: number,
            passwordChangedAt: Date
          ) {
            if (passwordChangedAt) {
              const changedTimestamp = parseInt(
                (passwordChangedAt.getTime() / 1000).toString(),
                10
              );

              return JWTTimestamp < changedTimestamp;
            }
            // False means NOT changed
            return false;
          },
        },
      },
      result: {
        user: {},
      },
    });

  return client;
}

// Infer type from factory return
export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

// Use globalThis for broader environment compatibility
const globalForPrisma = globalThis as typeof globalThis & {
  prisma: ExtendedPrismaClient | undefined;
};

// Named export with global memoization
export const prisma: ExtendedPrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "../generated/prisma/client.js";
