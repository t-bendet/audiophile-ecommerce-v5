import { $Enums, Prisma } from "@repo/database";
import { z } from "zod";
import { IdValidator, NameValidator } from "@repo/types";

// ** Base Types

type TUserRole = $Enums.ROLE;

type UserUpdateInput = Prisma.UserUpdateInput;

type UserCreateInput = Prisma.UserCreateInput;

export type UserPublicInfo = Prisma.UserGetPayload<{
  omit: {
    password: true;
    passwordConfirm: true;
    active: true;
  };
}>;

// ** Base Validators

const EmailValidator = z.email({ message: "Please provide a valid email!" });

const PasswordValidator = (identifier: string = "Password") => {
  return z
    .string({
      message: `${identifier} is required`,
    })
    .min(8)
    .max(20);
};

// *  User Create

export const CreateUserSchema = z.object({
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
    }) satisfies z.Schema<UserCreateInput>,
});

export type CreateUserInput = z.infer<typeof CreateUserSchema.shape.body>;

// *  User Read

export const LoginUserSchema = z.object({
  body: z
    .object({
      email: EmailValidator,
      password: PasswordValidator(),
    })
    .strict() satisfies z.Schema<UserUpdateInput>,
}); //

export type LoginUserInput = z.infer<typeof LoginUserSchema.shape.body>;

// type ReadOutput = Prisma.Result<typeof prisma.user, UserCreateInput, "create">;

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

//* User Update

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
