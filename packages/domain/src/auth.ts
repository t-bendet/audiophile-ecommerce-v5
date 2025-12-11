import z from "zod";
import { EmailValidator, NameValidator, PasswordValidator } from "./shared.js";

export const AuthSignUpUserSchema = z.object({
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

export type AuthSignUpUser = z.infer<typeof AuthSignUpUserSchema.shape.body>;

export const AuthLoginUserSchema = z.object({
  body: z
    .object({
      email: EmailValidator,
      password: PasswordValidator(),
    })
    .strict(),
});

export type AuthLoginUser = z.infer<typeof AuthLoginUserSchema.shape.body>;

export const AuthUpdateUserPasswordSchema = z.object({
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

export type AuthUpdateUserPassword = z.infer<
  typeof AuthUpdateUserPasswordSchema.shape.body
>;
