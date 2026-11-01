import {
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS_TRANSITIONS,
  type AdminOrderDTO,
  type OrderStatus,
  type PaymentStatus,
} from "@repo/domain";

/** "PENDING" becomes "Pending", the status language of the design note. */
export const statusLabel = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase();

/** The current value first, then exactly the moves the domain table allows. */
export const orderStatusOptions = (
  current: OrderStatus,
): readonly OrderStatus[] => [current, ...ORDER_STATUS_TRANSITIONS[current]];

export const paymentStatusOptions = (
  current: PaymentStatus,
): readonly PaymentStatus[] => [
  current,
  ...PAYMENT_STATUS_TRANSITIONS[current],
];

/** Cancelling a paid order is allowed; the owner is reminded a refund may be due. */
export const refundMayBeDue = (
  order: Pick<AdminOrderDTO, "paymentStatus">,
  nextStatus: OrderStatus,
) => nextStatus === "CANCELLED" && order.paymentStatus === "PAID";
