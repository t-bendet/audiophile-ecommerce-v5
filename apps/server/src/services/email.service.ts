import type { OrderDTO } from "@repo/domain";
import type { Logger } from "pino";
import { orderConfirmationEmail } from "../emails/order-confirmation.js";
import { passwordResetEmail } from "../emails/password-reset.js";
import { emailTransport, type EmailTransport } from "../utils/email.js";
import { env } from "../utils/env.js";
import type { PasswordResetIssue } from "../utils/password-reset-token.js";

/**
 * Sends the emails the store owes a shopper. A send is never on a request's
 * critical path: a failure is logged through the request logger, so the line
 * carries the request id, and the caller's response is unchanged.
 */
export const createEmailService = (
  transport: EmailTransport,
  /** The storefront origin the emailed links point at. */
  clientUrl: string,
) => ({
  async sendOrderConfirmation(order: OrderDTO, log: Logger): Promise<void> {
    try {
      await transport.send(orderConfirmationEmail(order));
    } catch (err) {
      log.error({ err, orderId: order.id }, "order confirmation email failed");
    }
  },

  async sendPasswordReset(
    issue: PasswordResetIssue,
    log: Logger,
  ): Promise<void> {
    try {
      await transport.send(passwordResetEmail(issue, clientUrl));
    } catch (err) {
      // Never the token: the log would hold a working link.
      log.error({ err, userId: issue.user.id }, "password reset email failed");
    }
  },
});

export type EmailService = ReturnType<typeof createEmailService>;

export const emailService: EmailService = createEmailService(
  emailTransport,
  env.CLIENT_URL,
);
