import type {
  Prisma,
  Category as PrismaCategory,
  CategoriesThumbnail,
} from "@repo/database";
import { $Enums } from "@repo/database";
import { z } from "zod";
import type {
  EmptyResponse,
  ListResponse,
  SingleItemResponse,
} from "./common.js";
import {
  createRequestSchema,
  EmptyResponseSchema,
  ListResponseSchema,
  SingleItemResponseSchema,
} from "./common.js";
import { IdValidator } from "./shared.js";

// * ===== Database Type Re-exports (Service Generics )=====

export type Category = PrismaCategory;
export type CategoryCreateInput = Prisma.CategoryCreateInput;
export type CategoryUpdateInput = Prisma.CategoryUpdateInput;
export type CategoryWhereInput = Prisma.CategoryWhereInput;
export type CategorySelect = Prisma.CategorySelect;
export type CategoryScalarFieldEnum = Prisma.CategoryScalarFieldEnum;

// *  ===== Entity Specific Types =====

export const NAME = $Enums.NAME;
export type NAME = $Enums.NAME;
export type CategoryProductsCreateManyInput =
  Prisma.ProductCreateManyCategoryInputEnvelope["data"];

// * =====  Common Schemas =====

export const CategoryThumbnailSchema = z.object({
  altText: z.string().min(1, "Alt text is required"),
  ariaLabel: z.string().min(1, "Aria label is required"),
  src: z.string().min(1, "Src is required"),
}) satisfies z.Schema<CategoriesThumbnail>;

// * ===== RequestSchemas =====

// LIST - Get all categories (pagination + filtering)
export const CategoryGetAllRequestSchema = createRequestSchema({
  query: z
    .object({
      sort: z.string().optional(),
      name: z.enum(NAME).optional(),
      fields: z.string().optional(),
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().optional(),
    })
    .optional(),
});

// GET - Get single category by ID
export const CategoryGetByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("Category") }).strict(),
});

// CREATE - Create new category
// TODO can't really create  new category now as NAME is enum
// TODO add CategoryProductsCreateManyInput if needed
export const CategoryCreateRequestSchema = createRequestSchema({
  body: z.object({
    name: z.enum(NAME),
    thumbnail: CategoryThumbnailSchema,
  }) satisfies z.ZodType<CategoryCreateInput>,
});

// UPDATE - Update existing category (partial)
export const CategoryUpdateByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("Category") }).strict(),
  body: z
    .object({
      name: z.enum(NAME).optional(),
      thumbnail: CategoryThumbnailSchema.optional(),
    })
    .strict() satisfies z.ZodType<CategoryUpdateInput>,
});

// DELETE - Delete category by ID
export const CategoryDeleteByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("Category") }).strict(),
});

// * =====  DTO Schemas ( base and others if needed)=====

export const CategoryDTOSchema = z.object({
  name: z.enum(NAME),
  id: IdValidator("Category"),
  createdAt: z.date(),
  v: z.number(),
  thumbnail: CategoryThumbnailSchema,
}) satisfies z.ZodType<Category>;

// * =====  DTO Types (if needed)=====

export type CategoryDTO = z.infer<typeof CategoryDTOSchema>;

// * =====   Response Schemas & Types ( For Frontend)=====

// List response (array + pagination)
export const CategoryGetAllResponseSchema =
  ListResponseSchema(CategoryDTOSchema);
export type CategoryGetAllResponse = ListResponse<Category>;

// Detail/Get response (single DTO)
export const CategoryGetByIdResponseSchema =
  SingleItemResponseSchema(CategoryDTOSchema);
export type CategoryGetByIdResponse = SingleItemResponse<Category>;

// Create response (single DTO)
export const CategoryCreateResponseSchema =
  SingleItemResponseSchema(CategoryDTOSchema);
export type CategoryCreateResponse = SingleItemResponse<Category>;

// Update response (single DTO)
export const CategoryUpdateByIdResponseSchema =
  SingleItemResponseSchema(CategoryDTOSchema);
export type CategoryUpdateByIdResponse = SingleItemResponse<Category>;

// Delete response (no content)
export const CategoryDeleteByIdResponseSchema = EmptyResponseSchema;
export type CategoryDeleteByIdResponse = EmptyResponse;
