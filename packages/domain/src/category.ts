import type { Prisma, Category as PrismaCategory } from "@repo/database";
import { $Enums } from "@repo/database";
import { z } from "zod";
import type { ListResponse } from "./common.js";
import { ListResponseSchema } from "./common.js";
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
    thumbnail: z.object({
      altText: z.string().min(1, "Alt text is required"),
      ariaLabel: z.string().min(1, "Alt text is required"),
      src: z.string().min(1, "Alt text is required"),
    }),
  }) satisfies z.Schema<CategoryCreateInput>,
  query: z.object({}).optional(),
});

// UPDATE - Update existing category (partial)
export const CategoryUpdateRequestSchema = z.object({
  params: z.object({ id: IdValidator("Category") }),
  body: z
    .object({
      label: z.string().min(1).optional(),
      description: z.string().optional(),
    })
    .strict(),
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

// * =====  Common Schemas =====

export const CategoryThumbnailSchema = z.object({
  altText: z.string(),
  ariaLabel: z.string(),
  src: z.string(),
});

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

// Detail response (single DTO)
export const CategoryDetailResponseSchema = z.object({
  data: CategoryDTOSchema,
});
export type CategoryDetailResponse = { data: CategoryDetailDTO };

// Create response (single DTO)
export const CategoryCreateResponseSchema = z.object({
  data: CategoryDTOSchema,
});
export type CategoryCreateResponse = { data: CategoryCreateDTO };

// Update response (single DTO)
export const CategoryUpdateResponseSchema = z.object({
  data: CategoryDTOSchema,
});
export type CategoryUpdateResponse = { data: CategoryUpdateDTO };

// Delete response (no content but status could be added if needed)
export const CategoryDeleteResponseSchema = z.object({
  data: z.null(),
});
export type CategoryDeleteResponse = { data: null };
