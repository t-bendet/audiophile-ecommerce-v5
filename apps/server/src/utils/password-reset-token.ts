import { createHash, randomBytes } from "node:crypto";

/**
 * A password reset token is emailed raw and stored only as its hash, so a
 * database read cannot yield a working link.
 */

export const hashPasswordResetToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export const generatePasswordResetToken = (): {
  token: string;
  tokenHash: string;
} => {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashPasswordResetToken(token) };
};

/** What a forgot-password request issued for an active user: the raw token goes in the email. */
export type PasswordResetIssue = {
  user: { id: string; email: string; name: string };
  token: string;
  expiresAt: Date;
};
