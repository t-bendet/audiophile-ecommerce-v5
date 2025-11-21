import { z } from 'zod';
export declare const HealthResponse: z.ZodObject<{
    status: z.ZodLiteral<"ok">;
}, z.core.$strip>;
export type HealthResponse = z.infer<typeof HealthResponse>;
//# sourceMappingURL=api.d.ts.map