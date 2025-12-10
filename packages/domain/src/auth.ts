import z from "zod";
import { EmailValidator, PasswordValidator } from "./shared.js";
import { UserUpdateInput } from "./user.js";

export const AuthSignInUserSchema = z.object({
  body: z
    .object({
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

export const AuthLoginUserSchema = z.object({
  body: z
    .object({
      email: EmailValidator,
      password: PasswordValidator(),
    })
    .strict() satisfies z.Schema<UserUpdateInput>,
});

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
    }) satisfies z.Schema<UserUpdateInput>,
});
