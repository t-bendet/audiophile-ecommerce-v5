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

// TODO needed?
export type ProductCreateResult = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: true;
    includedItems: true;
  };
}>;

// * =====  Common Schemas =====

export const ProductsImagesThumbnailSchema = z.object({
  altText: z.string().min(1, "Alt text is required"),
  ariaLabel: z.string().min(1, "Aria label is required"),
  src: z.string().min(1, "Src is required"),
}) satisfies z.Schema<ProductsImagesThumbnail>;

export const ProductImagesPropertiesSchema = z.object({
  altText: z.string().min(1, "Alt text is required"),
  ariaLabel: z.string().min(1, "Aria label is required"),
  desktopSrc: z.string().min(1, "Desktop src is required"),
  mobileSrc: z.string().min(1, "Mobile src is required"),
  tabletSrc: z.string().min(1, "Tablet src is required"),
});

const ProductPropertiesSchema = z.object({
  cartLabel: z.string().min(1, "Cart label is required"),
  description: z.string().min(1, "Description is required"),
  featuredImageText: z
    .string()
    .min(1, "Featured image text is required")
    .nullable()
    .optional(),
  featuresText: z.array(z.string().min(1)).optional(),
  fullLabel: z.array(z.string().min(1)).optional(),
  isNewProduct: z.boolean().optional(),
  name: z.string().min(1, "Name is required"),
  price: z.number().int().nonnegative(),
  shortLabel: z.string().min(1, "Short label is required"),
  showCaseImageText: z
    .string()
    .min(1, "Showcase image text is required")
    .nullable()
    .optional(),
  slug: z.string().min(1, "Slug is required"),
  includedItems: z
    .array(
      z.object({
        item: z.string().min(1, "Item name is required"),
        quantity: z.number().int().positive("Quantity must be positive"),
      })
    )
    .optional(),
  images: z.object({
    featuredImage: ProductImagesPropertiesSchema.nullish(),
    galleryImages: z.array(ProductImagesPropertiesSchema),
    introImage: ProductImagesPropertiesSchema,
    primaryImage: ProductImagesPropertiesSchema,
    showCaseImage: ProductImagesPropertiesSchema.nullish(),
    thumbnail: ProductsImagesThumbnailSchema,
    relatedProductImage: ProductImagesPropertiesSchema,
  }),
  category: z.object({
    connect: z.object({ id: IdValidator("Category") }).strict(),
  }),
});

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

// GET - Get Product by path
export const ProductGetByPathSchema = createRequestSchema({});

// GET - Get Product by Slug

export const ProductGetBySlugSchema = createRequestSchema({
  params: z.object({ slug: z.string().min(1, "Slug is required") }).strict(),
});

// get product by slug - slug param

// CREATE - Create new product
export const ProductCreateRequestSchema = createRequestSchema({
  body: ProductPropertiesSchema satisfies z.Schema<ProductCreateInput>,
});

// UPDATE - Update existing Product (partial)
export const ProductUpdateByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("Product ") }).strict(),
  body: ProductPropertiesSchema.partial() satisfies z.Schema<ProductUpdateInput>,
});

// DELETE - Delete product by ID
export const ProductDeleteByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("Product") }).strict(),
});

// * =====  DTO Types (if needed)=====

// export type CategoryListDTO = Category;
// export type CategoryDetailDTO = Category;

// * =====  DTO Schemas ( base and others if needed)=====

// export const CategoryDTOSchema = ProductPropertiesSchema.partial() satisfies z.Schema<Product>;

// * =====   Response Schemas & Types ( For Frontend)=====

const ProductByCategorySchema = z.object({
  slug: z.string(),
  fullLabel: z.array(z.string()),
  id: IdValidator("product"),
  isNewProduct: z.boolean(),
  images: z.object({
    introImage: z.object({
      mobileSrc: z.string(),
      tabletSrc: z.string(),
      desktopSrc: z.string(),
      altText: z.string(),
      ariaLabel: z.string(),
    }),
  }),
});

export const ProductsByCategorySchemas = z.array(ProductByCategorySchema);
