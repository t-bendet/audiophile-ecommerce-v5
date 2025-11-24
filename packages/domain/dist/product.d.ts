import { Prisma } from "@repo/database";
import { z } from "zod";
export type ProductCreateWithoutCategoryInput = Prisma.ProductCreateWithoutCategoryInput;
export type ProductCreateResult = Prisma.ProductGetPayload<{
    include: {
        category: true;
        images: true;
        includedItems: true;
    };
}>;
export declare const GetProductsByCategorySchema: z.ZodObject<{
    params: z.ZodObject<{
        category: z.ZodEnum<{
            [x: string]: any;
        }>;
    }, z.core.$strict>;
}, z.core.$strip>;
export type GetProductsByCategoryParams = z.infer<typeof GetProductsByCategorySchema.shape.params>;
export declare const GetProductBySlugSchema: z.ZodObject<{
    params: z.ZodObject<{
        slug: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>;
export type GetProductBySlugParams = z.infer<typeof GetProductBySlugSchema.shape.params>;
//# sourceMappingURL=product.d.ts.map