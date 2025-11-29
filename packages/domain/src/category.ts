import type { Category as PrismaCategory, Prisma } from "@repo/database";
import { $Enums } from "@repo/database";
import { z } from "zod";
import { BaseEntity, IdValidator, NameValidator } from "./shared.js";

// ===== Database Type Re-exports =====
export type Category = PrismaCategory;
export type CategoryWhereInput = Prisma.CategoryWhereInput;
export type CategoryCreateInput = Prisma.CategoryCreateInput;
export type CategorySelect = Prisma.CategorySelect;
export type CategoryScalarFieldEnum = Prisma.CategoryScalarFieldEnum;
export const NAME = $Enums.NAME;
export type NAME = $Enums.NAME;

// ===== Types =====
export type TCategoryName = $Enums.NAME;

export const CategoryNameValues = Object.values($Enums.NAME) as [
  $Enums.NAME,
  ...$Enums.NAME[],
];

export interface CategoryEntity extends BaseEntity {
  name: $Enums.NAME;
  thumbnail: {
    altText: string;
    ariaLabel: string;
    src: string;
  };
}

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

// export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>["body"];
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>["body"];
