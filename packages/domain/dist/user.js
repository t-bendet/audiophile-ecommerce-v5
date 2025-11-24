import { z } from "zod";
import { IdValidator, NameValidator, EmailValidator, PasswordValidator, } from "@repo/validators";
// ** Schemas
export const CreateUserSchema = z.object({
    body: z
        .object({
        name: NameValidator("User"),
        email: EmailValidator,
        password: PasswordValidator(),
        passwordConfirm: PasswordValidator("Password confirm"),
    })
        .strict()
        .refine((data) => data.password === data.passwordConfirm, {
        message: "Password and PasswordConfirm must match!",
        params: { passwordConfirm: "passwordConfirm" },
        path: ["password match"],
    }),
});
export const LoginUserSchema = z.object({
    body: z
        .object({
        email: EmailValidator,
        password: PasswordValidator(),
    })
        .strict(),
});
export const UserPublicOutput = z
    .object({
    id: IdValidator("User"),
    name: NameValidator("User"),
    role: z.custom(),
    email: EmailValidator,
    passwordChangedAt: z.date(),
    passwordResetToken: z.string().nullable(),
    passwordResetExpires: z.date().nullable(),
    emailVerified: z.boolean(),
    createdAt: z.date(),
    v: z.number(),
})
    .strict();
export const UpdateUserDetailsSchema = z.object({
    body: z
        .object({
        name: NameValidator("User").optional(),
        email: EmailValidator.optional(),
    })
        .strict(),
});
export const UpdateUserPasswordSchema = z.object({
    body: z
        .object({
        currentPassword: PasswordValidator("Current Password"),
        password: PasswordValidator("New Password"),
        passwordConfirm: PasswordValidator("New Password Confirm"),
    })
        .strict()
        .refine((data) => data.password === data.passwordConfirm, {
        message: "Password and PasswordConfirm must match!",
        params: { passwordConfirm: "passwordConfirm" },
        path: ["password match"],
    }),
});
