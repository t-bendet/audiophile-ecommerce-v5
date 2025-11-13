import { Prisma } from "../generated/prisma/client.js";
import type { NAME } from "../generated/prisma/enums.js";

export const ProductExtensions = Prisma.defineExtension((client: any) => {
  return client.$extends({
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
          // TODO create a one to one relation with config? but this is a temporary solution
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
          // TODO create a one to one relation with config,add this changes and test
          // ** to product schema
          //           featuredProductId  String                  @db.ObjectId
          // featuredProduct  Product                 @relation(fields: [featuredProductId], references: [id])
          // ** to config seed
          //       featuredProductId: createdProductsMap["xx99 mark two headphones"],
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
  });
});
