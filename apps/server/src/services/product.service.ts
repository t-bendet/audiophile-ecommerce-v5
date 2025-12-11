import { NAME, prisma } from "@repo/database";
import {
  baseQueryParams,
  ErrorCode,
  Meta,
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
export interface ProductFilter extends Pick<Product, "name"> {}

export interface ProductQueryParams extends baseQueryParams, ProductFilter {}

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
  ): Promise<{ data: ProductsByCategoryNameDTO; meta: Meta }> {
    // Find category by name
    const products = await prisma.product.findMany({
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

    if (!products) {
      throw new AppError("Products not found", ErrorCode.NOT_FOUND);
    }

    return {
      data: products,
      meta: {
        page: 1,
        limit: products.length,
        total: products.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      } satisfies Meta,
    };
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
  ): Promise<{ data: ProductRelatedProductsDTO; meta: Meta }> {
    // Get base product info
    // TODO aggregate to reduce queries
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
    return {
      data: relatedProducts,
      meta: {
        page: 1,
        limit: relatedProducts.length,
        total: relatedProducts.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      } satisfies Meta,
    };
  }

  /**
   * Get showcase products from config
   * Returns products mapped to their showcase positions (cover, wide, grid)
   */
  async getShowCaseProducts(): Promise<ProductShowCaseProductsDTO> {
    // Fetch config to know which products to showcase
    const select = {
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
    } satisfies ProductSelect;

    const config = await prisma.config.findFirst({
      include: {
        showCaseCover: {
          select,
        },
        showCaseWide: {
          select,
        },
        showCaseGrid: {
          select,
        },
      },
    });

    if (!config) {
      throw new AppError(
        "Site configuration not found",
        ErrorCode.INTERNAL_ERROR
      );
    }

    // Get the showcase product IDs from config

    // Business logic: Map products to their positions

    // Validate all positions are filled
    if (!config.showCaseCover || !config.showCaseWide || !config.showCaseGrid) {
      throw new AppError(
        "Incomplete showcase configuration",
        ErrorCode.INTERNAL_ERROR
      );
    }

    return {
      showCaseCover: config.showCaseCover,
      showCaseWide: config.showCaseWide,
      showCaseGrid: config.showCaseGrid,
    };
  }

  /**
   * Get the featured product from config
   */
  async getFeaturedProduct(): Promise<ProductFeaturedProductsDTO> {
    const config = await prisma.config.findFirst({
      include: {
        featuredProduct: {
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
        },
      },
    });

    if (!config) {
      throw new AppError(
        "Site configuration not found",
        ErrorCode.INTERNAL_ERROR
      );
    }

    if (!config.featuredProduct) {
      throw new AppError("Featured product not found", ErrorCode.NOT_FOUND);
    }

    // Business validation: Featured product must have required fields
    if (!config.featuredProduct.featuredImageText) {
      throw new AppError(
        "Featured product missing featured text",
        ErrorCode.INTERNAL_ERROR
      );
    }

    if (!config.featuredProduct.images?.featuredImage) {
      throw new AppError(
        "Featured product missing featured image",
        ErrorCode.INTERNAL_ERROR
      );
    }

    return config.featuredProduct;
  }
}

// Export singleton instance
export const productService = new ProductService();
