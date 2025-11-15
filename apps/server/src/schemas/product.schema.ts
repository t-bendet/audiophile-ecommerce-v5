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

export const ReadByNameSchema = z.object({
  params: z
    .object({
      category: z.enum(
        categorySchema.CategoryName as unknown as readonly string[]
      ),
    })
    .strict(),
});

export type ReadByNameInput = z.infer<typeof ReadByNameSchema.shape.params>;

export const ReadBySlugSchema = z.object({
  params: z
    .object({
      slug: z.string().min(1, "Slug is required"),
    })
    .strict(),
});

export type ReadBySlugInput = z.infer<typeof ReadBySlugSchema.shape.params>;
