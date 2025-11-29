import type {
  Prisma,
  CategoryCreateInput as CategoryCreateInputType,
} from "@repo/database";
import { $Enums } from "@repo/database";
import type { Category as PrismaCategory } from "@repo/database";
import { z } from "zod";
import { BaseEntity, IdValidator, NameValidator } from "./shared.js";

// ===== Database Type Re-exports (Service Generics )=====
// **
// ** Each Service that extends AbstractCrudService needs these types defined:
// ** Entity,CreateInput, UpdateInput, WhereInput, Select, scaler fields
//**

export type Category = PrismaCategory;
export type CategoryCreateInput = CategoryCreateInputType;
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
}) satisfies z.Schema<{
  body: CategoryCreateInput;
}>;

// Update (partial)
export const categoryUpdateSchema = z.object({
  params: z.object({ id: IdValidator("Category") }),
  body: z.object({
    label: z.string().min(1).optional(),
    description: z.string().optional(),
  }),
  query: z.object({}).optional(),
});
