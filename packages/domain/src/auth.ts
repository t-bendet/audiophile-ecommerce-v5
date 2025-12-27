import z from "zod";
import { SingleItemResponse, SingleItemResponseSchema } from "./index.js";
import {
  EmailValidator,
  IdValidator,
  NameValidator,
  PasswordValidator,
} from "./shared.js";
import { ROLE, UserDTO } from "./user.js";

// * ===== RequestSchemas =====

export const AuthSignUpRequestSchema = z.object({
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

export type AuthSignUpRequest = z.infer<
  typeof AuthSignUpRequestSchema.shape.body
>;

export const AuthLoginRequestSchema = z.object({
  body: z
    .object({
      email: EmailValidator,
      password: PasswordValidator(),
    })
    .strict(),
});

export type AuthLoginRequest = z.infer<
  typeof AuthLoginRequestSchema.shape.body
>;

export const AuthUpdatePasswordRequestSchema = z.object({
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

export type AuthUpdateUserPasswordRequest = z.infer<
  typeof AuthUpdatePasswordRequestSchema.shape.body
>;

// * =====  DTO Types (if needed)=====

const AuthSessionDTOSchema = z
  .object({
    user: z.object({
      id: IdValidator("User"),
      name: NameValidator("User"),
      email: EmailValidator,
      role: z.enum(ROLE),
      emailVerified: z.boolean(),
      createdAt: z.coerce.date(),
      v: z.number(),
    }),
    token: z.string(),
  })
  .strict() satisfies z.ZodType<{ user: UserDTO; token: string }>;

export type AuthSessionDTO = z.infer<typeof AuthSessionDTOSchema>;

// * =====   Response Schemas & Types ( For Frontend)=====

export const AuthSignUpResponseSchema =
  SingleItemResponseSchema(AuthSessionDTOSchema);

export type AuthSignUpResponse = SingleItemResponse<AuthSessionDTO>;

// export const AuthLoginUserResponseSchema = z.object({
//   user: UserDTO,
//   token: z.string(),
// });

// export const AuthUpdateUserPasswordResponseSchema = z.object({
//   user: UserDTO,
//   token: z.string(),
// });
