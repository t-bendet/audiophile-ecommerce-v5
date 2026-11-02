import { PASSWORD_RESET_EXPIRY_LABEL } from "@repo/domain";
import type { EmailMessage } from "../utils/email.js";
import type { PasswordResetIssue } from "../utils/password-reset-token.js";
import { escapeHtml } from "./escape-html.js";

/**
 * The email a forgot-password request sends an active user. The link carries
 * the raw token; the server holds only its hash.
 */

export const passwordResetUrl = (clientUrl: string, token: string): string =>
  `${clientUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;

const EXPIRY_SENTENCE = `The link works once and expires in ${PASSWORD_RESET_EXPIRY_LABEL}.`;
const IGNORE_SENTENCE =
  "If you did not ask for this, ignore this email; your password stays as it is.";

export const passwordResetText = (name: string, resetUrl: string): string =>
  [
    `Hi ${name},`,
    "",
    "We received a request to reset the password for your Audiophile account. Open this link to choose a new one:",
    "",
    resetUrl,
    "",
    EXPIRY_SENTENCE,
    "",
    IGNORE_SENTENCE,
  ].join("\n");

export const passwordResetHtml = (name: string, resetUrl: string): string => {
  const href = escapeHtml(resetUrl);
  return `<!doctype html>
<html lang="en">
<body style="font-family: sans-serif; color: #101010; max-width: 560px; margin: 0 auto; padding: 24px;">
<h1 style="font-size: 20px;">Reset your password</h1>
<p>Hi ${escapeHtml(name)},</p>
<p>We received a request to reset the password for your Audiophile account. Open this link to choose a new one:</p>
<p><a href="${href}" style="color: #d87d4a; font-weight: bold;">Choose a new password</a></p>
<p style="word-break: break-all;">${href}</p>
<p>${EXPIRY_SENTENCE}</p>
<p>${escapeHtml(IGNORE_SENTENCE)}</p>
</body>
</html>`;
};

export const passwordResetEmail = (
  { user, token, expiresAt }: PasswordResetIssue,
  clientUrl: string,
): EmailMessage => {
  const resetUrl = passwordResetUrl(clientUrl, token);
  return {
    to: user.email,
    subject: "Reset your Audiophile password",
    text: passwordResetText(user.name, resetUrl),
    html: passwordResetHtml(user.name, resetUrl),
    // A new request issues a new expiry, so it is a new send, not a retry.
    idempotencyKey: `password-reset/${user.id}/${expiresAt.getTime()}`,
  };
};
