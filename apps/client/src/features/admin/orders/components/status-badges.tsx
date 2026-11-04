import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@repo/domain";
import { statusLabel } from "../transitions";

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant={status.toLowerCase() as Lowercase<PaymentStatus>}>
      {statusLabel(status)}
    </Badge>
  );
}
