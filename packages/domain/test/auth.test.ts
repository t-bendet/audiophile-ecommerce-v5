import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  AuthForgotPasswordRequestSchema,
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

describe("password reset expiry", () => {
  it("is one hour, and the label says so", () => {
    expect(PASSWORD_RESET_EXPIRY_MS).toBe(3_600_000);
    expect(PASSWORD_RESET_EXPIRY_LABEL).toBe("one hour");
  });
});
