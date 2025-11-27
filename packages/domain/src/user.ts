import { $Enums, Prisma } from "@repo/database";
import { z } from "zod";
import {
  IdValidator,
  NameValidator,
  EmailValidator,
  PasswordValidator,
} from "./shared.js";

// ** Base Types

export type TUserRole = $Enums.ROLE;

type UserUpdateInput = Prisma.UserUpdateInput;

type UserCreateInput = Prisma.UserCreateInput;

export type UserPublicInfo = Prisma.UserGetPayload<{
  omit: {
    password: true;
    passwordConfirm: true;
    active: true;
  };
}>;

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
    }) satisfies z.Schema<UserCreateInput>,
});

export type CreateUserInput = z.infer<typeof CreateUserSchema.shape.body>;

export const LoginUserSchema = z.object({
  body: z
    .object({
      email: EmailValidator,
      password: PasswordValidator(),
    })
    .strict() satisfies z.Schema<UserUpdateInput>,
});

export type LoginUserInput = z.infer<typeof LoginUserSchema.shape.body>;

export const UserPublicOutput = z
  .object({
    id: IdValidator("User"),
    name: NameValidator("User"),
    role: z.custom<TUserRole>(),
    email: EmailValidator,
    passwordChangedAt: z.date(),
    passwordResetToken: z.string().nullable(),
    passwordResetExpires: z.date().nullable(),
    emailVerified: z.boolean(),
    createdAt: z.date(),
    v: z.number(),
  })
  .strict() satisfies z.Schema<UserPublicInfo>;

export const UpdateUserDetailsSchema = z.object({
  body: z
    .object({
      name: NameValidator("User").optional(),
      email: EmailValidator.optional(),
    })
    .strict() satisfies z.Schema<UserUpdateInput>,
});

export type UpdateUserDetailsInput = z.infer<
  typeof UpdateUserDetailsSchema.shape.body
>;

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
    }) satisfies z.Schema<UserUpdateInput>,
});

export type UpdateUserPasswordInput = z.infer<
  typeof UpdateUserPasswordSchema.shape.body
>;
