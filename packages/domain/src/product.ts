import { Prisma } from "@repo/database";
import { z } from "zod";
import { CategoryNameValues } from "./category.js";

export type ProductCreateWithoutCategoryInput =
  Prisma.ProductCreateWithoutCategoryInput;

export type ProductCreateResult = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: true;
    includedItems: true;
  };
}>;

export const GetProductsByCategorySchema = z.object({
  params: z
    .object({
      category: z.enum(CategoryNameValues),
    })
    .strict(),
});

export type GetProductsByCategoryParams = z.infer<
  typeof GetProductsByCategorySchema.shape.params
>;

export const GetProductBySlugSchema = z.object({
  params: z
    .object({
      slug: z.string().min(1, "Slug is required"),
    })
    .strict(),
});

export type GetProductBySlugParams = z.infer<
  typeof GetProductBySlugSchema.shape.params
>;
