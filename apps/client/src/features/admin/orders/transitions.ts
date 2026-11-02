import {
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS_TRANSITIONS,
  type AdminOrderDTO,
  type OrderDTO,
  type OrderStatus,
  type PaymentStatus,
} from "@repo/domain";

export type FulfilmentStatuses = Pick<
  OrderDTO,
  "status" | "paymentStatus" | "updatedAt"
>;

/**
 * The order a save answered stays the form's starting point until the
 * refetched order is at least as recent, so the selects never step back to the
 * statuses from before the save while the refetch is in flight.
 */
export const latestStatuses = (
  order: FulfilmentStatuses,
  saved: FulfilmentStatuses | undefined,
): FulfilmentStatuses =>
  saved && saved.updatedAt.getTime() > order.updatedAt.getTime()
    ? saved
    : order;

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
