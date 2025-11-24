import { Prisma } from "@repo/database";
import z from "zod";
import { CategoryNameValues } from "@repo/schemas/category";

// ** Base Types

export type ProductCreateWithoutCategoryInput =
  Prisma.ProductCreateWithoutCategoryInput;

// Use a simpler type instead of Prisma.Result since we can't rely on runtime prisma instance for types
export type ProductCreateResult = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: true;
    includedItems: true;
  };
}>;

// *  Product Read

export const ReadProductsByCategorySchema = z.object({
  params: z
    .object({
      category: z.enum(CategoryNameValues),
    })
    .strict(),
});

export type ReadProductsByCategoryParams = z.infer<
  typeof ReadProductsByCategorySchema.shape.params
>;

export const ReadProductBySlugSchema = z.object({
  params: z
    .object({
      slug: z.string().min(1, "Slug is required"),
    })
    .strict(),
});

export type ReadProductBySlugParams = z.infer<
  typeof ReadProductBySlugSchema.shape.params
>;
