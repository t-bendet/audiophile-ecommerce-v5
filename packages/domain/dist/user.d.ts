import { $Enums, Prisma } from "@repo/database";
import { z } from "zod";
export type TUserRole = $Enums.ROLE;
export type UserPublicInfo = Prisma.UserGetPayload<{
    omit: {
        password: true;
        passwordConfirm: true;
        active: true;
    };
}>;
export declare const CreateUserSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        passwordConfirm: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>;
export type CreateUserInput = z.infer<typeof CreateUserSchema.shape.body>;
export declare const LoginUserSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>;
export type LoginUserInput = z.infer<typeof LoginUserSchema.shape.body>;
export declare const UserPublicOutput: z.ZodObject<{
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
export declare const UpdateUserDetailsSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strip>;
export type UpdateUserDetailsInput = z.infer<typeof UpdateUserDetailsSchema.shape.body>;
export declare const UpdateUserPasswordSchema: z.ZodObject<{
    body: z.ZodObject<{
        currentPassword: z.ZodString;
        password: z.ZodString;
        passwordConfirm: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strip>;
export type UpdateUserPasswordInput = z.infer<typeof UpdateUserPasswordSchema.shape.body>;
//# sourceMappingURL=user.d.ts.map