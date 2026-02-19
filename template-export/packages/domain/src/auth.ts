import { z } from "zod";
import {
  EmptyResponse,
  EmptyResponseSchema,
  SingleItemResponse,
  SingleItemResponseSchema,
} from "./common.js";
import { EmailValidator, NameValidator, PasswordValidator } from "./shared.js";
import { UserDTO, UserDTOSchema } from "./user.js";

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
      path: ["passwordConfirm"],
    })
    .strict(),
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

export interface AuthUpdateUserPasswordRequest extends z.infer<
  typeof AuthUpdatePasswordRequestSchema.shape.body
> {}

// * =====   Response Schemas & Types ( For Frontend)=====

export const AuthResponseSchema = SingleItemResponseSchema(UserDTOSchema);

export type AuthResponse = SingleItemResponse<UserDTO>;

export const AuthLogoutResponseSchema = EmptyResponseSchema;

export type AuthLogoutResponse = EmptyResponse;

export const AuthCheckStatusResponseSchema = SingleItemResponseSchema(
  z
    .object({
      isAuthenticated: z.boolean(),
    })
    .strict(),
);

export type AuthCheckStatusResponse = SingleItemResponse<{
  isAuthenticated: boolean;
}>;
