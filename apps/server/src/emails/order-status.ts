import { formatPrice, type OrderDTO } from "@repo/domain";
import type { EmailMessage } from "../utils/email.js";
import { escapeHtml } from "./escape-html.js";

const statusEmail = (
  order: OrderDTO,
  clientUrl: string,
  status: "SHIPPED" | "CANCELLED",
  detail: string,
): EmailMessage => {
  const url = `${clientUrl}/account/orders/${order.id}`;
  const subject =
    status === "SHIPPED"
      ? "Your order has shipped"
      : "Your order was cancelled";
  return {
    to: order.shippingAddress.email,
    subject,
    text: `Hi ${order.shippingAddress.fullName},\n\n${subject}. ${detail}\n\nView your order: ${url}`,
    html: `<!doctype html><html lang="en"><body><h1>${subject}</h1><p>Hi ${escapeHtml(order.shippingAddress.fullName)},</p><p>${subject}. ${escapeHtml(detail)}</p><p><a href="${escapeHtml(url)}">View your order</a></p></body></html>`,
    idempotencyKey: `order-status/${order.id}/${status}`,
  };
};

export const orderShippedEmail = (
  order: OrderDTO,
  clientUrl: string,
): EmailMessage => {
  const event = [...order.events]
    .reverse()
    .find((entry) => entry.status === "SHIPPED");
  return statusEmail(
    order,
    clientUrl,
    "SHIPPED",
    `Carrier: ${event?.carrier}. Tracking number: ${event?.trackingNumber}.`,
  );
};

export const orderCancelledEmail = (
  order: OrderDTO,
  clientUrl: string,
): EmailMessage => {
  const detail =
    order.paymentStatus === "PAID" || order.paymentStatus === "REFUNDED"
      ? `${formatPrice(order.total)} will be refunded to your ${order.paymentMethod} account.`
      : "Nothing was charged.";
  return statusEmail(order, clientUrl, "CANCELLED", detail);
};
