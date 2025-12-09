import { NAME, prisma } from "@repo/database";
import {
  ErrorCode,
  Product,
  ProductCreateInput,
  ProductDTO,
  ProductFeaturedProductsDTO,
  ProductRelatedProductsDTO,
  ProductsByCategoryNameDTO,
  ProductSelect,
  ProductShowCaseProductsDTO,
  ProductUpdateInput,
  ProductWhereInput,
} from "@repo/domain";
import AppError from "../utils/appError.js";
import { AbstractCrudService } from "./abstract-crud.service.js";

// TODO !importent after this file is done, go back and fix all mismatched types in abstract-crud.service.ts

// TODO: tune DTO and filter types as needed
// TODO scalar fields and filter should match

type ProductFilter = Pick<Product, "name">;

// TODO define query params type
export type ProductQueryParams = {
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

  // ***** Persistence Layer Methods (to be implemented by subclasses) *****
  // *include filtering, pagination, ordering, selection as needed for list operations*

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

    return this.pickFieldsByNotAllowed(input, disallowedFields);
  }

  protected async persistUpdate(id: string, input: ProductUpdateInput) {
    try {
      const entity = await prisma.product.update({
        where: { id },
        data: input,
      });
      return entity;
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

  protected parseSelect(fields?: string): ProductSelect | undefined {
    if (!fields || typeof fields !== "string") return undefined;
    // TODO refine valid fields
    const validFields = [
      "id",
      "cartLabel",
      "name",
      "slug",
      "price",
      "categoryId",
      "createdAt",
      "v",
      "shortLabel",
      "fullLabel",
      "description",
      "isNewProduct",
      "featuredImageText",
      "showCaseImageText",
      "featuresText",
    ] satisfies readonly (keyof Product)[];

    const select: Partial<ProductSelect> = {};
    for (const field of fields.split(",")) {
      if (validFields.includes(field as (typeof validFields)[number])) {
        select[field as keyof ProductSelect] = true;
      }
    }
    return Object.keys(select).length ? (select as ProductSelect) : undefined;
  }

  // TODO refine filter parsing as needed
  protected buildWhere(filter?: ProductFilter): ProductWhereInput {
    if (!filter?.name) {
      return {};
    }
    return {
      name: {
        equals: filter.name,
        mode: "insensitive",
      },
    };
  }

  protected parseFilter(query: ProductQueryParams): ProductFilter | undefined {
    if (!query.name || typeof query.name !== "string") {
      return undefined;
    }
    return { name: query.name };
  }

  // ** Helper Methods (optional overrides) **

  async getProductBySlug(slug: string): Promise<ProductDTO> {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product)
      throw new AppError("No document found with that ID", ErrorCode.NOT_FOUND);
    return this.toDTO(product);
  }

  async getProductsByCategoryName(
    categoryName: NAME
  ): Promise<ProductsByCategoryNameDTO> {
    // Find category by name
    const products = await prisma.product.getProductsByCategory(categoryName);

    if (!products) {
      throw new AppError("Products not found", ErrorCode.NOT_FOUND);
    }

    return products;
  }

  /**
   * Get related products based on category similarity and price range
   * Algorithm:
   * 1. Find products in same category OR within ±20% price range
   * 2. If less than 3 found, backfill with any other products
   * 3. Return max 3 products
   */

  async getRelatedProducts(
    productId: string
  ): Promise<ProductRelatedProductsDTO> {
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
  async getShowCaseProducts(): Promise<ProductShowCaseProductsDTO> {
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
  async getFeaturedProduct(): Promise<ProductFeaturedProductsDTO> {
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

// Type '{ id: string; shortLabel: string; showCaseImageText: string | null; categoryId: string; slug: string; images: { showCaseImage: { altText: string; ariaLabel: string; desktopSrc: string; mobileSrc: string; tabletSrc: string; } | null; }; } | null' is not assignable to type '{ id: string; shortLabel: string; showCaseImageText: string | null; categoryId: string; slug: string; images: { showCaseImages: { altText: string; ariaLabel: string; desktopSrc: string; mobileSrc: string; tabletSrc: string; }; } | null; } | null'.
// Type '{ id: string; shortLabel: string; showCaseImageText: string | null; categoryId: string; slug: string; images: { showCaseImage: { altText: string; ariaLabel: string; desktopSrc: string; mobileSrc: string; tabletSrc: string; } | null; }; }' is not assignable to type '{ id: string; shortLabel: string; showCaseImageText: string | null; categoryId: string; slug: string; images: { showCaseImages: { altText: string; ariaLabel: string; desktopSrc: string; mobileSrc: string; tabletSrc: string; }; } | null; }'.
// Types of property 'images' are incompatible.
// Property 'showCaseImages' is missing in type '{ showCaseImage: { altText: string; ariaLabel: string; desktopSrc: string; mobileSrc: string; tabletSrc: string; } | null; }' but required in type '{ showCaseImages: { altText: string; ariaLabel: string; desktopSrc: string; mobileSrc: string; tabletSrc: string; }; }'.
