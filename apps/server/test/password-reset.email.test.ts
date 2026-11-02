import { PASSWORD_RESET_EXPIRY_LABEL } from "@repo/domain";
import { describe, expect, it } from "vitest";
import {
  passwordResetEmail,
  passwordResetUrl,
} from "../src/emails/password-reset.js";
import type { PasswordResetIssue } from "../src/utils/password-reset-token.js";

const CLIENT_URL = "https://shop.example.com";

const issue: PasswordResetIssue = {
  user: {
    id: "507f1f77bcf86cd799439012",
    email: "ada@example.com",
    name: 'Ada <"Countess"> & Co',
  },
  token: "0123456789abcdef".repeat(4),
  expiresAt: new Date("2026-11-02T11:00:00Z"),
};

const resetUrl = `https://shop.example.com/auth/reset-password?token=${issue.token}`;

describe("passwordResetUrl", () => {
  it("points at the client's reset page with the token in the query string", () => {
    expect(passwordResetUrl(CLIENT_URL, issue.token)).toBe(resetUrl);
  });

  it("encodes a token that is not URL-safe", () => {
    expect(passwordResetUrl(CLIENT_URL, "a b&c")).toBe(
      "https://shop.example.com/auth/reset-password?token=a%20b%26c",
    );
  });
});

describe("passwordResetEmail", () => {
  it("addresses the user with a subject and a key named after this request", () => {
    expect(passwordResetEmail(issue, CLIENT_URL)).toMatchObject({
      to: "ada@example.com",
      subject: "Reset your Audiophile password",
      idempotencyKey: `password-reset/507f1f77bcf86cd799439012/${issue.expiresAt.getTime()}`,
    });
  });

  it("carries the link and the expiry in both parts", () => {
    const { text, html } = passwordResetEmail(issue, CLIENT_URL);

    expect(text).toContain(resetUrl);
    expect(html).toContain(`<a href="${resetUrl}"`);
    for (const body of [text, html]) {
      expect(body).toContain(
        `The link works once and expires in ${PASSWORD_RESET_EXPIRY_LABEL}.`,
      );
      expect(body).toContain("your password stays as it is");
    }
  });

  it("escapes the user's name in the HTML part", () => {
    const { html } = passwordResetEmail(issue, CLIENT_URL);

    expect(html).toContain("Hi Ada &lt;&quot;Countess&quot;&gt; &amp; Co,");
    expect(html).not.toContain('<"Countess">');
  });
});
