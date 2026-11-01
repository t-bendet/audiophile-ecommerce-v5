import { Badge } from "@/components/ui/badge";
import type { OrderStatus, PaymentStatus } from "@repo/domain";
import { statusLabel } from "../transitions";

/** The one pill for order status, in the list, the detail page and the stats breakdown. */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={status.toLowerCase() as Lowercase<OrderStatus>}>
      {statusLabel(status)}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant={status.toLowerCase() as Lowercase<PaymentStatus>}>
      {statusLabel(status)}
    </Badge>
  );
}
