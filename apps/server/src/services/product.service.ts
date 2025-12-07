import { prisma } from "@repo/database";
import type { NAME } from "@repo/database";
import AppError from "../utils/appError.js";

export class ProductService {
  /**
   * Get related products based on category similarity and price range
   * Algorithm:
   * 1. Find products in same category OR within ±20% price range
   * 2. If less than 3 found, backfill with any other products
   * 3. Return max 3 products
   */
  async getRelatedProducts(productId: string) {
    // Get base product info
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, price: true },
    });

    if (!product) {
      throw new AppError("Product not found", 404, "NOT_FOUND");
    }

    // Business logic: Define similarity rules
    const priceRangeMultiplier = 0.2; // ±20%
    const minRelatedProducts = 3;

    // Find related products by category or price similarity
    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { not: productId },
        OR: [
          { categoryId: product.categoryId },
          {
            price: {
              gte: product.price * (1 - priceRangeMultiplier),
              lte: product.price * (1 + priceRangeMultiplier),
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
      take: minRelatedProducts,
    });

    // Backfill if we don't have enough related products
    if (relatedProducts.length < minRelatedProducts) {
      // @ts-ignore
      const excludedIds = [productId, ...relatedProducts.map((p) => p.id)];
      const remainingCount = minRelatedProducts - relatedProducts.length;

      const additionalProducts = await prisma.product.findMany({
        where: {
          id: { notIn: excludedIds },
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
        take: remainingCount,
      });

      relatedProducts.push(...additionalProducts);
    }

    return relatedProducts;
  }

  /**
   * Get showcase products from config
   * Returns products mapped to their showcase positions (cover, wide, grid)
   */
  async getShowCaseProducts() {
    // Fetch config to know which products to showcase
    const config = await prisma.config.findFirst();

    if (!config) {
      throw new AppError("Site configuration not found", 500, "INTERNAL_ERROR");
    }

    // Get the showcase product IDs from config
    const showcaseIds = [
      config.showCaseProducts.cover,
      config.showCaseProducts.wide,
      config.showCaseProducts.grid,
    ];

    // Fetch the actual products
    const products = await prisma.product.findMany({
      where: {
        id: { in: showcaseIds },
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

    // Business logic: Map products to their positions
    const showcaseMap: Record<
      "cover" | "wide" | "grid",
      (typeof products)[number] | null
    > = {
      cover: null,
      wide: null,
      grid: null,
    };

    // @ts-ignore
    products.forEach((product) => {
      if (product.id === config.showCaseProducts.cover) {
        showcaseMap.cover = product;
      } else if (product.id === config.showCaseProducts.wide) {
        showcaseMap.wide = product;
      } else if (product.id === config.showCaseProducts.grid) {
        showcaseMap.grid = product;
      }
    });

    // Validate all positions are filled
    if (!showcaseMap.cover || !showcaseMap.wide || !showcaseMap.grid) {
      throw new AppError(
        "Incomplete showcase configuration",
        500,
        "INTERNAL_ERROR"
      );
    }

    return showcaseMap;
  }

  /**
   * Get the featured product from config
   */
  async getFeaturedProduct() {
    const config = await prisma.config.findFirst();

    if (!config) {
      throw new AppError("Site configuration not found", 500, "INTERNAL_ERROR");
    }

    const product = await prisma.product.findUnique({
      where: {
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

    if (!product) {
      throw new AppError("Featured product not found", 404, "NOT_FOUND");
    }

    // Business validation: Featured product must have required fields
    if (!product.featuredImageText) {
      throw new AppError(
        "Featured product missing featured text",
        500,
        "INTERNAL_ERROR"
      );
    }

    if (!product.images?.featuredImage) {
      throw new AppError("Featured product missing featured image", 500);
    }

    return product;
  }
}

// Export singleton instance
export const productService = new ProductService();
