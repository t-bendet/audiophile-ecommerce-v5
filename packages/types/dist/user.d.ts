import { Prisma } from "@repo/database";
import { z } from "zod";
export type UserPublicInfo = Prisma.UserGetPayload<{
    omit: {
        password: true;
        passwordConfirm: true;
        active: true;
    };
}>;
export declare const CreateSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        passwordConfirm: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>;
export type CreateInput = z.infer<typeof CreateSchema.shape.body>;
export declare const ReadSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>;
export type ReadInput = z.infer<typeof ReadSchema.shape.body>;
export declare const ReadPublicOutput: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    role: z.ZodCustom<$Enums.ROLE, $Enums.ROLE>;
    email: z.ZodString;
    passwordChangedAt: z.ZodDate;
    passwordResetToken: z.ZodNullable<z.ZodString>;
    passwordResetExpires: z.ZodNullable<z.ZodDate>;
    emailVerified: z.ZodBoolean;
    createdAt: z.ZodDate;
    v: z.ZodNumber;
}, z.core.$strict>;
export declare const UpdateDetailsSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strip>;
export type UpdateDetailsInput = z.infer<typeof UpdateDetailsSchema.shape.body>;
export declare const UpdatePasswordSchema: z.ZodObject<{
    body: z.ZodObject<{
        currentPassword: z.ZodString;
        password: z.ZodString;
        passwordConfirm: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>;
export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema.shape.body>;
//# sourceMappingURL=user.d.ts.map