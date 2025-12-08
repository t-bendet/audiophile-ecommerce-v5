import { prisma } from "@repo/database";
import {
  ErrorCode,
  Product,
  ProductCreateInput,
  ProductDTO,
  ProductSelect,
  ProductUpdateInput,
  ProductWhereInput,
} from "@repo/domain";
import AppError from "../utils/appError.js";
import { AbstractCrudService } from "./abstract-crud.service.js";

// TODO: tune DTO and filter types as needed
// TODO scalar fields and filter should match

type ProductFilter = Pick<Product, "name" | "categoryId">;

// TODO define query params type
export type CategoryQueryParams = {
  name?: string;
  page?: string | number;
  limit?: string | number;
  sort?: string;
  fields?: string;
};

export class ProductService extends AbstractCrudService<
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  ProductDTO,
  ProductWhereInput,
  ProductSelect,
  ProductFilter
> {
  protected toDTO(entity: Product): ProductDTO {
    return entity;
  }

  protected async persistFindMany(params: {
    where: ProductWhereInput;
    skip: number;
    take: number;
    orderBy?: any;
    select?: ProductSelect;
  }): Promise<{ data: Product[]; total: number }> {
    const [data, total] = await prisma.$transaction([
      prisma.product.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
        select: params.select,
      }),
      prisma.product.count({ where: params.where }),
    ]);
    return { data, total };
  }

  protected async persistFindById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  }

  protected async persistCreate(input: ProductCreateInput) {
    return prisma.product.create({ data: input });
  }

  /**
   * Whitelist only allowed fields for updates
   * Prevents clients from updating fields like 'id', 'createdAt', 'v', etc.
   */
  protected filterUpdateInput(input: ProductUpdateInput): ProductUpdateInput {
    // Define which fields are allowed to be updated
    const disallowedFields: (keyof typeof input)[] = [
      "createdAt",
      "v",

      // Add other updateable fields here
    ];

    return this.pickFieldsNotAllowedToUpdate(input, disallowedFields);
  }

  protected async persistUpdate(id: string, input: ProductUpdateInput) {
    try {
      return await prisma.product.update({ where: { id }, data: input });
    } catch (e: any) {
      if (e?.code === "P2025") return null;
      throw e;
    }
  }

  protected async persistDelete(id: string) {
    try {
      await prisma.product.delete({ where: { id } });
      return true;
    } catch (e: any) {
      if (e?.code === "P2025") return false;
      throw e;
    }
  }

  protected buildWhere(filter?: ProductFilter): ProductWhereInput {
    return filter ?? {};
  }

  protected parseFilter(_query: any): ProductFilter | undefined {
    return undefined; // Customize when filters are added
  }

  protected parseSelect(fields?: string): ProductSelect | undefined {
    if (!fields || typeof fields !== "string") return undefined;
    const validFields = [
      "id",
      "cartLabel",
      "name",
      "slug",
      "price",
      "categoryId",
      "createdAt",
      "v",
    ] as const;

    const select: Partial<ProductSelect> = {};
    for (const field of fields.split(",")) {
      if (validFields.includes(field as (typeof validFields)[number])) {
        select[field as keyof ProductSelect] = true;
      }
    }
    return Object.keys(select).length ? (select as ProductSelect) : undefined;
  }

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
      throw new AppError("Product not found", ErrorCode.NOT_FOUND);
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
      throw new AppError(
        "Site configuration not found",
        ErrorCode.INTERNAL_ERROR
      );
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
        ErrorCode.INTERNAL_ERROR
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
      throw new AppError(
        "Site configuration not found",
        ErrorCode.INTERNAL_ERROR
      );
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
      throw new AppError("Featured product not found", ErrorCode.NOT_FOUND);
    }

    // Business validation: Featured product must have required fields
    if (!product.featuredImageText) {
      throw new AppError(
        "Featured product missing featured text",
        ErrorCode.INTERNAL_ERROR
      );
    }

    if (!product.images?.featuredImage) {
      throw new AppError(
        "Featured product missing featured image",
        ErrorCode.INTERNAL_ERROR
      );
    }

    return product;
  }
}

// Export singleton instance
export const productService = new ProductService();
