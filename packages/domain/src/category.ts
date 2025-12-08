import type { Prisma, Category as PrismaCategory } from "@repo/database";
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

// * =====  Common Schemas =====

export const CategoryThumbnailSchema = z.object({
  altText: z.string().min(1, "Alt text is required"),
  ariaLabel: z.string().min(1, "Aria label is required"),
  src: z.string().min(1, "Src is required"),
});

// * ===== RequestSchemas =====

// LIST - Get all categories (pagination + filtering)
export const CategoryGetAllRequestSchema = createRequestSchema({
  query: z
    .object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().optional(),
      orderBy: z.string().optional(),
      label: z.string().optional(),
      slug: z.string().optional(),
      fields: z.string().optional(),
      name: z.enum(NAME).optional(),
    })
    .optional(),
});

// GET - Get single category by ID
export const CategoryGetByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("Category") }).strict(),
});

// CREATE - Create new category
// TODO can't really create  new category now as NAME is enum
export const CategoryCreateRequestSchema = createRequestSchema({
  body: z.object({
    name: z.enum(NAME),
    thumbnail: CategoryThumbnailSchema,
  }) satisfies z.Schema<CategoryCreateInput>,
});

// UPDATE - Update existing category (partial)
export const CategoryUpdateByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("Category") }),
  body: z
    .object({
      name: z.enum(NAME).optional(),
      thumbnail: CategoryThumbnailSchema.optional(),
    })
    .strict() satisfies z.Schema<CategoryUpdateInput>,
});

// DELETE - Delete category by ID
export const CategoryDeleteByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("Category") }),
});

// * =====  DTO Types (if needed)=====

export type CategoryListDTO = Category;
export type CategoryDetailDTO = Category;
export type CategoryCreateDTO = Category;
export type CategoryUpdateDTO = Category;

// * =====  DTO Schemas ( base and others if needed)=====

export const CategoryDTOSchema = z.object({
  id: z.string(),
  name: z.enum(NAME),
  thumbnail: CategoryThumbnailSchema,
  createdAt: z.date(),
  v: z.number(),
});

// * =====   Response Schemas & Types ( For Frontend)=====

// List response (array + pagination)
export const CategoryListResponseSchema = ListResponseSchema(CategoryDTOSchema);
export type CategoryListResponse = ListResponse<Category>;

// Detail/Get response (single DTO)
export const CategoryGetResponseSchema =
  SingleItemResponseSchema(CategoryDTOSchema);
export type CategoryGetResponse = SingleItemResponse<Category>;

// Create response (single DTO)
export const CategoryCreateResponseSchema =
  SingleItemResponseSchema(CategoryDTOSchema);
export type CategoryCreateResponse = SingleItemResponse<Category>;

// Update response (single DTO)
export const CategoryUpdateResponseSchema =
  SingleItemResponseSchema(CategoryDTOSchema);
export type CategoryUpdateResponse = SingleItemResponse<Category>;

// Delete response (no content)
export const CategoryDeleteResponseSchema = EmptyResponseSchema;
export type CategoryDeleteResponse = EmptyResponse;
