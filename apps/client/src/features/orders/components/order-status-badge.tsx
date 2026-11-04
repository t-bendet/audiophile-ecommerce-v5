import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@repo/domain";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={status.toLowerCase() as Lowercase<OrderStatus>}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}
