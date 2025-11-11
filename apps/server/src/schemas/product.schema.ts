import { Prisma, prisma } from "@repo/database";
import z from "zod";
import * as categorySchema from "./category.schema";

// ** Base Types

export type ProductCreateWithoutCategoryInput =
  Prisma.ProductCreateWithoutCategoryInput;

export type ProductCreateResult = Prisma.Result<
  typeof prisma.product,
  ProductCreateWithoutCategoryInput,
  "create"
>;

// *  Product Read

// TODO make category union dynamic

export const ReadByNameSchema = z.object({
  params: z
    .object({
      category: z.union([
        z.literal("Headphones"),
        z.literal("Earphones"),
        z.literal("Speakers"),
      ]),
    })
    .strict() satisfies z.Schema<{
    category: categorySchema.TCategoryName;
  }>,
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
