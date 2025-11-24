import { z } from "zod";
export declare const GetByIdSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>;
export type GetByIdParams = z.infer<typeof GetByIdSchema>["params"];
//# sourceMappingURL=common.d.ts.map