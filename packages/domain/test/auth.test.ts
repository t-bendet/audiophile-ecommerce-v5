import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  AuthForgotPasswordRequestSchema,
  AuthResetPasswordRequestSchema,
  PASSWORD_RESET_EXPIRY_LABEL,
  PASSWORD_RESET_EXPIRY_MS,
} from "../src/auth.js";

const forgotPasswordBody = AuthForgotPasswordRequestSchema.shape.body;

describe("AuthForgotPasswordRequestSchema", () => {
  it("reads the email from the body", () => {
    expect(forgotPasswordBody.parse({ email: "ada@example.com" })).toEqual({
      email: "ada@example.com",
    });
  });

  it("rejects an email that is not one, at the email field", () => {
    const result = forgotPasswordBody.safeParse({ email: "not-an-email" });

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(ZodError);
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([
      ["email"],
    ]);
  });

  it("rejects an unknown field", () => {
    expect(() =>
      forgotPasswordBody.parse({ email: "ada@example.com", role: "ADMIN" }),
    ).toThrow(ZodError);
  });
});

const resetPasswordBody = AuthResetPasswordRequestSchema.shape.body;

const RESET_BODY = {
  token: "a".repeat(64),
  password: "new-password",
  passwordConfirm: "new-password",
};

const issuePaths = (body: unknown) =>
  resetPasswordBody.safeParse(body).error?.issues.map((issue) => issue.path);

describe("AuthResetPasswordRequestSchema", () => {
  it("reads the token and the new password from the body", () => {
    expect(resetPasswordBody.parse(RESET_BODY)).toEqual(RESET_BODY);
  });

  it("accepts an empty token, which the server answers as an invalid link", () => {
    expect(
      resetPasswordBody.safeParse({ ...RESET_BODY, token: "" }).success,
    ).toBe(true);
  });

  it("rejects a body without a token, at the token field", () => {
    const { token: _, ...withoutToken } = RESET_BODY;

    expect(issuePaths(withoutToken)).toEqual([["token"]]);
  });

  it("rejects a password shorter than the signup rule, at the password field", () => {
    expect(
      issuePaths({
        ...RESET_BODY,
        password: "1234567",
        passwordConfirm: "1234567",
      }),
    ).toContainEqual(["password"]);
  });

  it("rejects a confirmation that does not match, at the confirmation field", () => {
    expect(
      issuePaths({ ...RESET_BODY, passwordConfirm: "other-password" }),
    ).toEqual([["passwordConfirm"]]);
  });

  it("rejects an unknown field", () => {
    expect(() =>
      resetPasswordBody.parse({ ...RESET_BODY, role: "ADMIN" }),
    ).toThrow(ZodError);
  });
});

describe("password reset expiry", () => {
  it("is one hour, and the label says so", () => {
    expect(PASSWORD_RESET_EXPIRY_MS).toBe(3_600_000);
    expect(PASSWORD_RESET_EXPIRY_LABEL).toBe("one hour");
  });
});
