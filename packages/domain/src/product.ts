import {
  Prisma,
  Product as PrismaProduct,
  ProductsImagesThumbnail,
} from "@repo/database";
import { z } from "zod";
import { NAME } from "./category.js";
import { createRequestSchema } from "./index.js";
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

export const ProductsByCategoryNameSchema = z.array(
  ProductPropertiesSchema.pick({
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
    .strict()
);

export const ProductRelatedProductsDTOSchema = z.array(
  ProductPropertiesSchema.pick({
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
    .strict()
);

export const ProductShowCaseProductsSchema = z.record(
  z.enum(["cover", "wide", "grid"]),
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

// TODO dfine response schemas and types if they differ from DTOs
