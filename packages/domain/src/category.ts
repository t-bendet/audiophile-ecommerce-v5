import type { Prisma, Category as PrismaCategory } from "@repo/database";
import { $Enums } from "@repo/database";
import { z } from "zod";
import {
  DeleteResponseSchema,
  ListResponseSchema,
  SuccessResponseSchema,
} from "./common.js";
import type {
  ListResponse,
  SuccessResponse,
  DeleteResponse,
} from "./common.js";
import { IdValidator, NameValidator } from "./shared.js";

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
export const CategoryGetAllRequestSchema = z.object({
  params: z.object({}).optional(),
  body: z.object({}).optional(),
  query: z
    .object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().optional(),
      orderBy: z.string().optional(),
      label: z.string().optional(),
      slug: z.string().optional(),
    })
    .optional(),
});

// GET - Get single category by ID
export const CategoryGetRequestSchema = z.object({
  params: z.object({ id: IdValidator("Category") }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

// CREATE - Create new category
// TODO can't really create  new category now as NAME is enum
export const CategoryCreateRequestSchema = z.object({
  params: z.object({}).optional(),
  body: z.object({
    name: z.enum(NAME),
    thumbnail: CategoryThumbnailSchema,
  }) satisfies z.Schema<CategoryCreateInput>,
  query: z.object({}).optional(),
});

// UPDATE - Update existing category (partial)
export const CategoryUpdateRequestSchema = z.object({
  params: z.object({ id: IdValidator("Category") }),
  body: z
    .object({
      name: z.enum(NAME),
      thumbnail: CategoryThumbnailSchema,
    })
    .strict() satisfies z.Schema<CategoryUpdateInput>,
  query: z.object({}).optional(),
});

// DELETE - Delete category by ID
export const CategoryDeleteRequestSchema = z.object({
  params: z.object({ id: IdValidator("Category") }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
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

// List response (array + meta)
export const CategoryListResponseSchema = ListResponseSchema(CategoryDTOSchema);
export type CategoryListResponse = ListResponse<typeof CategoryDTOSchema>;

// Detail/Get response (single DTO)
export const CategoryGetResponseSchema =
  SuccessResponseSchema(CategoryDTOSchema);
export type CategoryGetResponse = SuccessResponse<typeof CategoryDTOSchema>;

// Create response (single DTO)
export const CategoryCreateResponseSchema =
  SuccessResponseSchema(CategoryDTOSchema);
export type CategoryCreateResponse = SuccessResponse<typeof CategoryDTOSchema>;

// Update response (single DTO)
export const CategoryUpdateResponseSchema =
  SuccessResponseSchema(CategoryDTOSchema);
export type CategoryUpdateResponse = SuccessResponse<typeof CategoryDTOSchema>;

// Delete response (no content)
export const CategoryDeleteResponseSchema = DeleteResponseSchema;
export type CategoryDeleteResponse = DeleteResponse;
