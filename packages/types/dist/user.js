import { z } from "zod";
import { IdValidator, NameValidator } from "./validators.js";
// ** Base Validators
const EmailValidator = z
    .string({ message: "Email is required" })
    .email("Please provide a valid email!");
const PasswordValidator = (identifier = "Password") => {
    return z
        .string({
        message: `${identifier} is required`,
    })
        .min(8)
        .max(20);
};
// *  User Create
export const CreateSchema = z.object({
    body: z
        .object({
        name: NameValidator("User"),
        email: EmailValidator,
        password: PasswordValidator(),
        passwordConfirm: PasswordValidator("Password confirm"),
    })
        .strict() // strict mode
        .refine((data) => data.password === data.passwordConfirm, {
        message: "Password and PasswordConfirm must match!",
        params: { passwordConfirm: "passwordConfirm" },
        path: ["password match"],
    }),
});
// *  User Read
export const ReadSchema = z.object({
    body: z
        .object({
        email: EmailValidator,
        password: PasswordValidator(),
    })
        .strict(),
}); //
// type ReadOutput = Prisma.Result<typeof prisma.user, UserCreateInput, "create">;
export const ReadPublicOutput = z
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
//* User Update
export const UpdateDetailsSchema = z.object({
    body: z
        .object({
        name: NameValidator("User").optional(),
        email: EmailValidator.optional(),
    })
        .strict(),
});
export const UpdatePasswordSchema = z.object({
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
