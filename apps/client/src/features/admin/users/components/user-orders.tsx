import { paths } from "@/config/paths";
import currencyFormatter from "@/utils/formatters";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { adminOrdersQueryOptions } from "../../orders/api/get-admin-orders";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "../../orders/components/status-badges";
import { shortOrderId } from "../../orders/order-id";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

const overline = "text-xs font-bold tracking-600 uppercase text-neutral-500";

/** The user's orders, newest first, each a link to the admin order detail. */
export function UserOrders({ userId }: { userId: string }) {
  const { data } = useSuspenseQuery(adminOrdersQueryOptions({ userId }));
  const title = `Orders (${data.meta.total})`;

  return (
    <section
      aria-label={title}
      className="flex flex-col gap-4 rounded-lg bg-neutral-100 p-6"
    >
      <h2 className={overline}>{title}</h2>
      {data.data.length === 0 ? (
        <p className="text-sm text-neutral-500">
          This user has not placed an order yet.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-200">
          {data.data.map((order) => (
            <li key={order.id}>
              <Link
                to={paths.admin.order.getHref(order.id)}
                className="flex flex-col gap-3 py-4 hover:text-primary-500 md:flex-row md:items-center md:justify-between"
              >
                <span className="flex items-baseline gap-4">
                  <span className="font-bold">{shortOrderId(order.id)}</span>
                  <span className="text-sm text-neutral-500">
                    {dateFormatter.format(order.createdAt)}
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                  <span className="font-bold text-neutral-900">
                    {currencyFormatter(order.total)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {data.meta.hasNext && (
        <Link
          to={`${paths.admin.orders.getHref()}?userId=${userId}`}
          className="w-fit text-xs font-bold tracking-600 text-neutral-500 uppercase hover:text-primary-500"
        >
          All orders
        </Link>
      )}
    </section>
  );
}
