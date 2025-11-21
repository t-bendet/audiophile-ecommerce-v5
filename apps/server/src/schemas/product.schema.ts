import { Prisma, prisma } from "@repo/database";
import z from "zod";
import * as categorySchema from "./category.schema.js";

// ** Base Types

export type ProductCreateWithoutCategoryInput =
  Prisma.ProductCreateWithoutCategoryInput;

export type ProductCreateResult = Prisma.Result<
  typeof prisma.product,
  ProductCreateWithoutCategoryInput,
  "create"
>;

// *  Product Read

export const ReadProductsByCategorySchema = z.object({
  params: z
    .object({
      category: z.enum(
        categorySchema.CategoryNameValues as unknown as readonly string[]
      ),
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
