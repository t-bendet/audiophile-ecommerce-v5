import z from "zod";
export type getByIdParams = z.infer<typeof GetByIdSchema>["params"];
export declare const GetByIdSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.z.core.$strict>;
}, z.z.core.$strip>;
//# sourceMappingURL=common.d.ts.map