import type { OrderDTO, OrderStatus } from "@repo/domain";
import { formatPrice } from "@repo/domain";

// The order has no history, tracking or carrier yet; the prototype synthesises
// them from createdAt so every status can be judged on a real order.

export type Actor = "you" | "store" | "carrier";

export type Tracking = { carrier: string; number: string; url: string };

export type TimelineEvent = {
  status: OrderStatus;
  title: string;
  detail: string;
  at: Date;
  actor: Actor;
  tracking?: Tracking;
};

export type Timeline = {
  status: OrderStatus;
  headline: string;
  events: TimelineEvent[];
  next?: string;
  tracking?: Tracking;
};

export const STEPS: readonly OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

export const STEP_LABEL: Record<OrderStatus, string> = {
  PENDING: "Placed",
  PROCESSING: "Preparing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const HEADLINE: Record<OrderStatus, string> = {
  PENDING: "We have received your order",
  PROCESSING: "Your order is being prepared",
  SHIPPED: "Your order is on its way",
  DELIVERED: "Your order was delivered",
  CANCELLED: "This order was cancelled",
};

export const ACTOR_LABEL: Record<Actor, string> = {
  you: "You",
  store: "Audiophile",
  carrier: "Carrier update",
};

export const TRACKING: Tracking = {
  carrier: "UPS",
  number: "1Z999AA10123456784",
  url: "https://www.ups.com/track?tracknum=1Z999AA10123456784",
};

const dayAfter = (date: Date, days: number) =>
  new Date(date.getTime() + days * 86_400_000 + 3 * 3_600_000);

export const statusLabel = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase();

export function buildTimeline(
  order: OrderDTO,
  override: string,
): Timeline {
  const status =
    override === "real" ? order.status : (override.toUpperCase() as OrderStatus);
  const placed: TimelineEvent = {
    status: "PENDING",
    title: "Order placed",
    detail: `You placed this order. We emailed a confirmation to ${order.shippingAddress.email}.`,
    at: order.createdAt,
    actor: "you",
  };
  const preparing: TimelineEvent = {
    status: "PROCESSING",
    title: "Being prepared",
    detail:
      order.paymentMethod === "Cash on Delivery"
        ? `You pay ${formatPrice(order.total)} in cash when it arrives.`
        : `We confirmed your payment of ${formatPrice(order.total)} by ${order.paymentMethod}.`,
    at: dayAfter(order.createdAt, 1),
    actor: "store",
  };
  const shipped: TimelineEvent = {
    status: "SHIPPED",
    title: "Shipped",
    detail: `We handed it to ${TRACKING.carrier}.`,
    at: dayAfter(order.createdAt, 2),
    actor: "store",
    tracking: TRACKING,
  };
  const delivered: TimelineEvent = {
    status: "DELIVERED",
    title: "Delivered",
    detail: `${TRACKING.carrier} confirmed delivery in ${order.shippingAddress.city}.`,
    at: dayAfter(order.createdAt, 5),
    actor: "carrier",
  };
  const cancelled: TimelineEvent = {
    status: "CANCELLED",
    title: "Cancelled",
    detail:
      order.paymentStatus === "PAID" || order.paymentStatus === "REFUNDED"
        ? `We cancelled this order. ${formatPrice(order.total)} will be refunded to your ${order.paymentMethod} account.`
        : "We cancelled this order. Nothing was charged.",
    at: dayAfter(order.createdAt, 1),
    actor: "store",
  };

  const ladder = [placed, preparing, shipped, delivered];
  const index = STEPS.indexOf(status);
  const events =
    status === "CANCELLED" ? [placed, cancelled] : ladder.slice(0, index + 1);
  const next =
    status === "CANCELLED" || index === STEPS.length - 1
      ? undefined
      : STEP_LABEL[STEPS[index + 1]];
  const tracking =
    status === "SHIPPED" || status === "DELIVERED" ? TRACKING : undefined;

  return { status, headline: HEADLINE[status], events, next, tracking };
}

export const shortOrderId = (id: string) => `#${id.slice(-8).toUpperCase()}`;

export const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

export const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});
