import type { Prisma, Category as PrismaCategory } from "@repo/database";
import { $Enums } from "@repo/database";
import { z } from "zod";
import type { ListResponse } from "./common.js";
import { ListResponseSchema } from "./common.js";
import { IdValidator, NameValidator } from "./shared.js";

// ===== Database Type Re-exports (Service Generics )=====
// **
// ** Each Service that extends AbstractCrudService needs these types defined:
// ** Entity,CreateInput, UpdateInput, WhereInput, Select, scaler fields
//**
export type Category = PrismaCategory;
export type CategoryCreateInput = Prisma.CategoryCreateInput;
export type CategoryUpdateInput = Prisma.CategoryUpdateInput;
export type CategoryWhereInput = Prisma.CategoryWhereInput;
export type CategorySelect = Prisma.CategorySelect;
export type CategoryScalarFieldEnum = Prisma.CategoryScalarFieldEnum;
// ===== Entity Specific Types =====

export const NAME = $Enums.NAME;
export type NAME = $Enums.NAME;

// ===== Schemas =====

// **
// Each operation needs to have its own schema
//**

// Query schema (basic pagination + filtering)
export const categoryQuerySchema = z.object({
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

// Params with id
export const categoryIdParamsSchema = z.object({
  params: z.object({ id: IdValidator("Category") }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

// Create
export const categoryCreateSchema = z.object({
  params: z.object({}).optional(),
  body: z.object({
    name: NameValidator("Category"),
    thumbnail: z.object({
      altText: z.string().min(1, "Alt text is required"),
      ariaLabel: z.string().min(1, "Alt text is required"),
      src: z.string().min(1, "Alt text is required"),
    }),
  }),
  query: z.object({}).optional(),
});

// Update (partial)
export const categoryUpdateSchema = z.object({
  params: z.object({ id: IdValidator("Category") }),
  body: z.object({
    label: z.string().min(1).optional(),
    description: z.string().optional(),
  }),
  query: z.object({}).optional(),
});

// ===== DTO Types =====
export type CategoryListDTO = Pick<Category, "id" | "name" | "thumbnail">;
export type CategoryDetailDTO = Pick<
  Category,
  "id" | "name" | "thumbnail" | "createdAt" | "v"
>;
export type CategoryCreateDTO = CategoryDetailDTO;
export type CategoryUpdateDTO = CategoryDetailDTO;

// ===== DTO Schemas =====
export const CategoryThumbnailSchema = z.object({
  altText: z.string(),
  ariaLabel: z.string(),
  src: z.string(),
});

export const CategoryListDTOSchema = z.object({
  id: z.string(),
  name: z.nativeEnum(NAME),
  thumbnail: CategoryThumbnailSchema,
});

export const CategoryDetailDTOSchema = CategoryListDTOSchema.extend({
  createdAt: z.date(),
  v: z.number(),
});

export const CategoryCreateDTOSchema = CategoryDetailDTOSchema;
export const CategoryUpdateDTOSchema = CategoryDetailDTOSchema;

// ===== Aggregated Response Schemas & Types =====

// List response (array + meta)
export const CategoryListResponseSchema = ListResponseSchema(
  CategoryListDTOSchema
);
export type CategoryListResponse = ListResponse<CategoryListDTO>;

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
