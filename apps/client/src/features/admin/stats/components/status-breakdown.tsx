import { ORDER_STATUS, type StatsDTO } from "@repo/domain";
import { OrderStatusBadge } from "../../orders/components/status-badges";

/** A pill per order status with its count, every status listed even at zero. */
export function StatusBreakdown({
  ordersByStatus,
}: {
  ordersByStatus: StatsDTO["ordersByStatus"];
}) {
  return (
    <section
      aria-labelledby="orders-by-status"
      className="flex flex-col gap-4 rounded-lg bg-neutral-100 p-6"
    >
      <h2
        id="orders-by-status"
        className="text-xs font-bold tracking-600 uppercase"
      >
        Orders by status
      </h2>
      <dl className="flex flex-col divide-y divide-neutral-200">
        {Object.values(ORDER_STATUS).map((status) => (
          <div
            key={status}
            className="flex h-12 items-center justify-between gap-4"
          >
            <dt>
              <OrderStatusBadge status={status} />
            </dt>
            <dd className="font-bold tabular-nums">{ordersByStatus[status]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
