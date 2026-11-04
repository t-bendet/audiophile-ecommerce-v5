import { formatPrice, paymentInstructions, type OrderDTO } from "@repo/domain";
import type { EmailMessage } from "../utils/email.js";
import { escapeHtml } from "./escape-html.js";

/**
 * The "order received" email a checkout sends. Payment status is set by an
 * admin later, so the copy says how payment is taken, never that it was.
 */

const totalsOf = (order: OrderDTO): [label: string, amount: number][] => [
  ["Subtotal", order.subtotal],
  ["Shipping", order.shippingCost],
  ["Tax", order.tax],
  ["Total", order.total],
];

const addressLines = (order: OrderDTO): string[] => {
  const { fullName, address, city, state, zipCode, country } =
    order.shippingAddress;
  return [fullName, address, `${city}, ${state} ${zipCode}`, country];
};

export const orderConfirmationText = (
  order: OrderDTO,
  clientUrl: string,
): string =>
  [
    `Hi ${order.shippingAddress.fullName},`,
    "",
    `We have received your order ${order.id}. ${paymentInstructions(order.paymentMethod)}`,
    "",
    `View your order: ${clientUrl}/account/orders/${order.id}`,
    "",
    "Items",
    ...order.items.map(
      (item) =>
        `- ${item.productName} x ${item.quantity}: ${formatPrice(item.subtotal)}`,
    ),
    "",
    ...totalsOf(order).map(
      ([label, amount]) => `${label}: ${formatPrice(amount)}`,
    ),
    "",
    "Shipping to",
    ...addressLines(order),
    "",
    "Thank you for shopping with Audiophile.",
  ].join("\n");

export const orderConfirmationHtml = (
  order: OrderDTO,
  clientUrl: string,
): string => {
  const items = order.items
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.productName)} &times; ${item.quantity}</td><td align="right">${formatPrice(item.subtotal)}</td></tr>`,
    )
    .join("");
  const totals = totalsOf(order)
    .map(
      ([label, amount]) =>
        `<tr><td>${label}</td><td align="right">${formatPrice(amount)}</td></tr>`,
    )
    .join("");
  const address = addressLines(order).map(escapeHtml).join("<br>");

  return `<!doctype html>
<html lang="en">
<body style="font-family: sans-serif; color: #101010; max-width: 560px; margin: 0 auto; padding: 24px;">
<h1 style="font-size: 20px;">Thank you for your order</h1>
<p>Hi ${escapeHtml(order.shippingAddress.fullName)},</p>
<p>We have received your order <strong>${order.id}</strong>. ${escapeHtml(paymentInstructions(order.paymentMethod))}</p>
<p><a href="${escapeHtml(`${clientUrl}/account/orders/${order.id}`)}">View your order</a></p>
<table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
<thead><tr><th align="left">Item</th><th align="right">Price</th></tr></thead>
<tbody>${items}</tbody>
<tfoot>${totals}</tfoot>
</table>
<h2 style="font-size: 16px;">Shipping to</h2>
<p>${address}</p>
<p>Thank you for shopping with Audiophile.</p>
</body>
</html>`;
};

export const orderConfirmationEmail = (
  order: OrderDTO,
  clientUrl: string,
): EmailMessage => ({
  to: order.shippingAddress.email,
  subject: `Order received: ${order.id}`,
  text: orderConfirmationText(order, clientUrl),
  html: orderConfirmationHtml(order, clientUrl),
  idempotencyKey: `order-confirmation/${order.id}`,
});
