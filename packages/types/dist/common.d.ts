import z from "zod";
export declare const GetByIdSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.z.core.$strict>;
}, z.z.core.$strip>;
export type getByIdParams = z.infer<typeof GetByIdSchema>["params"];
//# sourceMappingURL=common.d.ts.map