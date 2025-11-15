import { Prisma } from "../generated/prisma/client.js";
import type { NAME } from "../generated/prisma/enums.js";
import type { PrismaClient } from "../generated/prisma/client.js";

export const ProductExtensions = Prisma.defineExtension({
  model: {
    product: {
      async getRelatedProducts(this: PrismaClient, id: string) {
        const product = await this.product.findUniqueOrThrow({
          where: {
            id,
          },
          select: {
            categoryId: true,
            price: true,
          },
        });
        const relatedProducts = await this.product.findMany({
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
          const additionalProducts = await this.product.findMany({
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
      async getShowCaseProducts(this: PrismaClient) {
        const config = await this.config.findFirstOrThrow();

        type ShowCaseProductsKeys = keyof typeof config.showCaseProducts;

        const products = await this.product.findMany({
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
      async getFeaturedProduct(this: PrismaClient) {
        const config = await this.config.findFirstOrThrow();

        const product = await this.product.findFirstOrThrow({
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
      async getProductsByCategory(this: PrismaClient, categoryName: NAME) {
        const products = await this.product.findMany({
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
