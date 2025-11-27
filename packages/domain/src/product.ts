import { prisma, Prisma } from "@repo/database";
import { z } from "zod";
import { CategoryNameValues } from "./category.js";
import { IdValidator } from "./shared.js";

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

export type TProductsByCategory = Awaited<
  ReturnType<(typeof prisma.product)["getProductsByCategory"]>
>;

const ProductByCategorySchema = z.object({
  slug: z.string(),
  fullLabel: z.array(z.string()),
  id: IdValidator("product"),
  isNewProduct: z.boolean(),
  images: z.object({
    introImage: z.object({
      mobileSrc: z.string(),
      tabletSrc: z.string(),
      desktopSrc: z.string(),
      altText: z.string(),
      ariaLabel: z.string(),
    }),
  }),
});

export const ProductsByCategorySchemas = z.array(ProductByCategorySchema);
