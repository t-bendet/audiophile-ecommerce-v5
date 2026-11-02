import { z } from "zod";
import {
  EmptyResponse,
  EmptyResponseSchema,
  SingleItemResponse,
  SingleItemResponseSchema,
} from "./common.js";
import {
  EmailValidator,
  PasswordResetTokenValidator,
  PasswordValidator,
  UserNameValidator,
} from "./shared.js";
import { UserDTO, UserDTOSchema } from "./user.js";

// * ===== RequestSchemas =====

export const AuthSignUpRequestSchema = z.object({
  body: z
    .object({
      name: UserNameValidator,
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

export type AuthUpdateUserPasswordRequest = z.infer<
  typeof AuthUpdatePasswordRequestSchema.shape.body
>;

export const AuthForgotPasswordRequestSchema = z.object({
  body: z
    .object({
      email: EmailValidator,
    })
    .strict(),
});

export type AuthForgotPasswordRequest = z.infer<
  typeof AuthForgotPasswordRequestSchema.shape.body
>;

export const AuthResetPasswordRequestSchema = z.object({
  body: z
    .object({
      token: PasswordResetTokenValidator,
      password: PasswordValidator("New password"),
      passwordConfirm: PasswordValidator("Confirm new password"),
    })
    .strict()
    .refine((data) => data.password === data.passwordConfirm, {
      message: "Password and PasswordConfirm must match!",
      path: ["passwordConfirm"],
    }),
});

export type AuthResetPasswordRequest = z.infer<
  typeof AuthResetPasswordRequestSchema.shape.body
>;

// * ===== Password reset =====

/** How long a password reset link works after it is sent. */
export const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;

/** `PASSWORD_RESET_EXPIRY_MS` in the words the email and the forgot page print. */
export const PASSWORD_RESET_EXPIRY_LABEL = "one hour";

// * =====   Response Schemas & Types ( For Frontend)=====

export const AuthResponseSchema = SingleItemResponseSchema(UserDTOSchema);

export type AuthResponse = SingleItemResponse<UserDTO>;

export const AuthLogoutResponseSchema = EmptyResponseSchema;

export type AuthLogoutResponse = EmptyResponse;

export const AuthForgotPasswordResponseSchema = EmptyResponseSchema;

export type AuthForgotPasswordResponse = EmptyResponse;

export const AuthResetPasswordResponseSchema = AuthResponseSchema;

export type AuthResetPasswordResponse = AuthResponse;

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
