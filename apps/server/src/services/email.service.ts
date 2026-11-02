import type { OrderDTO } from "@repo/domain";
import type { Logger } from "pino";
import { orderConfirmationEmail } from "../emails/order-confirmation.js";
import { emailTransport, type EmailTransport } from "../utils/email.js";

/**
 * Sends the emails the store owes a shopper. A send is never on a request's
 * critical path: a failure is logged through the request logger, so the line
 * carries the request id, and the caller's response is unchanged.
 */
export const createEmailService = (transport: EmailTransport) => ({
  async sendOrderConfirmation(order: OrderDTO, log: Logger): Promise<void> {
    try {
      await transport.send(orderConfirmationEmail(order));
    } catch (err) {
      log.error({ err, orderId: order.id }, "order confirmation email failed");
    }
  },
});

export type EmailService = ReturnType<typeof createEmailService>;

export const emailService: EmailService = createEmailService(emailTransport);
