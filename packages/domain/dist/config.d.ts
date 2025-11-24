import { z } from "zod";
export declare const CreateConfigSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        featuredProduct: z.ZodString;
        showCaseProducts: z.ZodObject<{
            cover: z.ZodString;
            wide: z.ZodString;
            grid: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strict>;
}, z.core.$strip>;
export type CreateConfigInput = z.infer<typeof CreateConfigSchema.shape.body>;
//# sourceMappingURL=config.d.ts.map