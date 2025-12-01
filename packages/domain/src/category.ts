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
export const CategoryListSchema = z.object({
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
export const CategoryGetSchema = z.object({
  params: z.object({ id: IdValidator("Category") }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

// CREATE - Create new category
// TODO can't really create  new category now as NAME is enum
export const CategoryCreateSchema = z.object({
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
export const CategoryUpdateSchema = z.object({
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
export const CategoryDeleteSchema = z.object({
  params: z.object({ id: IdValidator("Category") }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

// * =====  DTO Types (if needed)=====
export type CategoryListDTO = Category;
export type CategoryDetailDTO = Category;
export type CategoryCreateDTO = Category;
export type CategoryUpdateDTO = Category;

// * =====  DTO Schemas =====
export const CategoryThumbnailSchema = z.object({
  altText: z.string(),
  ariaLabel: z.string(),
  src: z.string(),
});

export const CategoryListDTOSchema = z.object({
  id: z.string(),
  name: z.enum(NAME),
  thumbnail: CategoryThumbnailSchema,
});

export const CategoryDetailDTOSchema = CategoryListDTOSchema.extend({
  createdAt: z.date(),
  v: z.number(),
});

export const CategoryCreateDTOSchema = CategoryDetailDTOSchema;
export const CategoryUpdateDTOSchema = CategoryDetailDTOSchema;

// * =====   Response Schemas & Types =====

// List response (array + meta)
export const CategoryListResponseSchema = ListResponseSchema(
  CategoryListDTOSchema
);
export type CategoryListResponse = ListResponse<typeof CategoryListDTOSchema>;

// Detail response (single DTO)
export const CategoryDetailResponseSchema = z.object({
  data: CategoryDetailDTOSchema,
});
export type CategoryDetailResponse = { data: CategoryDetailDTO };

// Create response (single DTO)
export const CategoryCreateResponseSchema = z.object({
  data: CategoryCreateDTOSchema,
});
export type CategoryCreateResponse = { data: CategoryCreateDTO };

// Update response (single DTO)
export const CategoryUpdateResponseSchema = z.object({
  data: CategoryUpdateDTOSchema,
});
export type CategoryUpdateResponse = { data: CategoryUpdateDTO };

// Delete response (no content but status could be added if needed)
export const CategoryDeleteResponseSchema = z.object({
  data: z.null(),
});
export type CategoryDeleteResponse = { data: null };
