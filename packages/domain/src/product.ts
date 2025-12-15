import type {
  Prisma,
  Product as PrismaProduct,
  ProductsImagesThumbnail,
} from "@repo/database";
import { z } from "zod";
import { NAME } from "./category.js";
import {
  createRequestSchema,
  EmptyResponse,
  EmptyResponseSchema,
  ListResponse,
  ListResponseSchema,
  SingleItemResponse,
  SingleItemResponseSchema,
} from "./index.js";
import { IdValidator } from "./shared.js";

// * ===== Database Type Re-exports (Service Generics )=====

export type Product = PrismaProduct;
export type ProductCreateInput = Prisma.ProductCreateInput;
export type ProductUpdateInput = Prisma.ProductUpdateInput;
export type ProductWhereInput = Prisma.ProductWhereInput;
export type ProductSelect = Prisma.ProductSelect;
export type ProductScalarFieldEnum = Prisma.ProductScalarFieldEnum;

// *  ===== Entity Specific Types =====

//

// * =====  Common Schemas =====

export const ProductsImagesThumbnailSchema = z
  .object({
    altText: z.string().min(1, "Alt text is required"),
    ariaLabel: z.string().min(1, "Aria label is required"),
    src: z.string().min(1, "Src is required"),
  })
  .strict() satisfies z.Schema<ProductsImagesThumbnail>;

export const ProductImagesPropertiesSchema = z
  .object({
    altText: z.string().min(1, "Alt text is required"),
    ariaLabel: z.string().min(1, "Aria label is required"),
    desktopSrc: z.string().min(1, "Desktop src is required"),
    mobileSrc: z.string().min(1, "Mobile src is required"),
    tabletSrc: z.string().min(1, "Tablet src is required"),
  })
  .strict();

export const ProductImagesObjectSchema = z.object({
  featuredImage: ProductImagesPropertiesSchema.nullable(),
  galleryImages: z.array(ProductImagesPropertiesSchema),
  introImage: ProductImagesPropertiesSchema,
  primaryImage: ProductImagesPropertiesSchema,
  showCaseImage: ProductImagesPropertiesSchema.nullable(),
  thumbnail: ProductsImagesThumbnailSchema,
  relatedProductImage: ProductImagesPropertiesSchema,
});

const ProductPropertiesSchema = z
  .object({
    cartLabel: z.string().min(1, "Cart label is required"),
    description: z.string().min(1, "Description is required"),
    featuredImageText: z
      .string()
      .min(1, "Featured image text is required")
      .nullable(),
    featuresText: z.array(z.string().min(1)),
    fullLabel: z.array(z.string().min(1)),
    isNewProduct: z.boolean(),
    name: z.string().min(1, "Name is required"),
    price: z.number().int().nonnegative(),
    shortLabel: z.string().min(1, "Short label is required"),
    showCaseImageText: z
      .string()
      .min(1, "Showcase image text is required")
      .nullable(),
    slug: z.string().min(1, "Slug is required"),
    includedItems: z.array(
      z
        .object({
          item: z.string().min(1, "Item name is required"),
          quantity: z.number().int().positive("Quantity must be positive"),
        })
        .strict()
    ),
    images: ProductImagesObjectSchema,
    v: z.number().int().nonnegative(),
    createdAt: z.date(),
    categoryId: IdValidator("Category"),
    id: IdValidator("Product"),
  })
  .strict() satisfies z.ZodType<Product>;

// * ===== RequestSchemas =====

// TODO choose which scalar fields are allowed for filtering, sorting, selecting
// LIST - Get all Products (pagination + filtering)
export const ProductGetAllRequestSchema = createRequestSchema({
  query: z
    .object({
      sort: z.string().optional(),
      fields: z.string().optional(),
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().optional(),
      name: z.string().optional(),
    })
    .optional(),
});

// GET - Get single Product by ID
export const ProductGetByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("Product") }).strict(),
});

// GET - Get related products by ID
export const ProductGetRelatedByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("Product") }).strict(),
});

// GET - Get Product by Category Name
export const ProductGetByCategorySchema = createRequestSchema({
  params: z.object({ category: z.enum(NAME) }).strict(),
});

// GET - Get Product by path(showcase, featured, etc.)
export const ProductGetByPathSchema = createRequestSchema({});

// GET - Get Product by Slug

export const ProductGetBySlugSchema = createRequestSchema({
  params: z.object({ slug: z.string().min(2, "Slug is required") }).strict(),
});

// CREATE - Create new product
export const ProductCreateRequestSchema = createRequestSchema({
  body: ProductPropertiesSchema.extend({
    category: z.object({
      connect: z.object({ id: IdValidator("Category") }).strict(),
    }),
  }).omit({
    createdAt: true,
    categoryId: true,
    v: true,
    id: true,
  }) satisfies z.ZodType<ProductCreateInput>,
});

// UPDATE - Update existing Product (partial)
export const ProductUpdateByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("Product ") }).strict(),
  body: ProductPropertiesSchema.partial() satisfies z.ZodType<ProductUpdateInput>,
});

// DELETE - Delete product by ID
export const ProductDeleteByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("Product") }).strict(),
});

// * =====  DTO Schemas ( base and others if needed)=====

export const ProductDTOSchema = ProductPropertiesSchema;

export const ProductsByCategoryNameSchema = ProductPropertiesSchema.pick({
  id: true,
  description: true,
  isNewProduct: true,
  fullLabel: true,
  slug: true,
})
  .extend({
    images: z.object({
      introImage: ProductImagesPropertiesSchema,
    }),
  })
  .strict();

export const ProductRelatedProductsDTOSchema = ProductPropertiesSchema.pick({
  id: true,
  shortLabel: true,
  images: true,
  slug: true,
})
  .extend({
    images: z.object({
      relatedProductImage: ProductImagesPropertiesSchema,
    }),
  })
  .strict();

export const ProductShowCaseProductsSchema = z.record(
  z.enum(["showCaseCover", "showCaseWide", "showCaseGrid"]),
  ProductPropertiesSchema.pick({
    id: true,
    shortLabel: true,
    showCaseImageText: true,
    categoryId: true,
    slug: true,
  })
    .extend({
      images: z.object({
        showCaseImage: ProductImagesPropertiesSchema.nullable(),
      }),
    })
    .strict()
    .nullable()
);

export const ProductFeaturedProductsSchema = ProductPropertiesSchema.pick({
  id: true,
  featuredImageText: true,
  description: true,
  fullLabel: true,
  isNewProduct: true,
  shortLabel: true,
  categoryId: true,
  slug: true,
})
  .extend({
    images: z.object({
      featuredImage: ProductImagesPropertiesSchema.nullable(),
    }),
  })
  .strict();

// * =====  DTO Types (if needed)=====

export type ProductDTO = z.infer<typeof ProductDTOSchema>;

export type ProductsByCategoryNameDTO = z.infer<
  typeof ProductsByCategoryNameSchema
>;

export type ProductRelatedProductsDTO = z.infer<
  typeof ProductRelatedProductsDTOSchema
>;

export type ProductShowCaseProductsDTO = z.infer<
  typeof ProductShowCaseProductsSchema
>;

export type ProductFeaturedProductsDTO = z.infer<
  typeof ProductFeaturedProductsSchema
>;

// * =====   Response Schemas & Types ( For Frontend)=====

// GetAll - List all products
export const ProductGetAllResponseSchema = ListResponseSchema(ProductDTOSchema);
export type ProductGetAllResponse = ListResponse<ProductDTO>;

// GetById - Get single product by ID
export const ProductGetByIdResponseSchema =
  SingleItemResponseSchema(ProductDTOSchema);
export type ProductGetByIdResponse = SingleItemResponse<ProductDTO>;

// GetBySlug - Get product by slug
export const ProductGetBySlugResponseSchema =
  SingleItemResponseSchema(ProductDTOSchema);
export type ProductGetBySlugResponse = SingleItemResponse<ProductDTO>;

// GetRelatedProducts - Get related products (list)
export const ProductGetRelatedResponseSchema = ListResponseSchema(
  ProductRelatedProductsDTOSchema
);
export type ProductGetRelatedResponse = ListResponse<ProductRelatedProductsDTO>;

// GetProductsByCategoryName - Get products by category (list)
export const ProductGetByCategoryResponseSchema = ListResponseSchema(
  ProductsByCategoryNameSchema
);
export type ProductGetByCategoryResponse =
  ListResponse<ProductsByCategoryNameDTO>;

// GetShowCaseProducts - Get showcase products (single object with cover/wide/grid)
export const ProductGetShowCaseResponseSchema = SingleItemResponseSchema(
  ProductShowCaseProductsSchema
);
export type ProductGetShowCaseResponse =
  SingleItemResponse<ProductShowCaseProductsDTO>;

// GetFeaturedProduct - Get featured product
export const ProductGetFeaturedResponseSchema = SingleItemResponseSchema(
  ProductFeaturedProductsSchema
);
export type ProductGetFeaturedResponse =
  SingleItemResponse<ProductFeaturedProductsDTO>;

// Create - Create new product
export const ProductCreateResponseSchema =
  SingleItemResponseSchema(ProductDTOSchema);
export type ProductCreateResponse = SingleItemResponse<ProductDTO>;

// Update - Update existing product
export const ProductUpdateResponseSchema =
  SingleItemResponseSchema(ProductDTOSchema);
export type ProductUpdateResponse = SingleItemResponse<ProductDTO>;

// Delete - Delete product (no content)
export const ProductDeleteResponseSchema = EmptyResponseSchema;
export type ProductDeleteResponse = EmptyResponse;
