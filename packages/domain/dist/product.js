import { z } from "zod";
import { CategoryNameValues } from "./category.js";
export const GetProductsByCategorySchema = z.object({
    params: z
        .object({
        category: z.enum(CategoryNameValues),
    })
        .strict(),
});
export const GetProductBySlugSchema = z.object({
    params: z
        .object({
        slug: z.string().min(1, "Slug is required"),
    })
        .strict(),
});
