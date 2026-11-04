import { Link } from "react-router";
import { paths } from "@/config/paths";
import { shortOrderId } from "../order-id";
import { OrderStatusBadge } from "./order-status-badge";
import currencyFormatter from "@/utils/formatters";
import { OrderDTO } from "@repo/domain";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

const statusLabel = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase();

export function OrderCard({ order }: { order: OrderDTO }) {
  const headingId = `order-${order.id}`;
  return (
    <article
      aria-labelledby={headingId}
      className="rounded-lg border p-4 text-neutral-900"
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id={headingId} className="font-bold">
            <Link to={paths.account.orderDetail.getHref(order.id)}>
              Order {shortOrderId(order.id)} ›
            </Link>
          </h2>
          <p className="text-sm text-neutral-600">
            Ordered {dateFormatter.format(order.createdAt)} ·{" "}
            {order.paymentMethod} · {statusLabel(order.paymentStatus)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <ul className="divide-y">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-3">
            <img
              src={item.productImage.src}
              alt=""
              width={item.productImage.width}
              height={item.productImage.height}
              className="h-12 w-12 rounded object-cover"
            />
            <div className="flex-1">
              <h3 className="text-sm font-bold uppercase">
                {item.productName}
              </h3>
              <p className="text-sm text-neutral-500">
                {currencyFormatter(item.price)} × {item.quantity}
              </p>
            </div>
            <span className="text-sm font-medium">
              {currencyFormatter(item.subtotal)}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 flex justify-between border-t pt-3 font-bold">
        <span>Total</span>
        <span className="text-primary-500">
          {currencyFormatter(order.total)}
        </span>
      </p>
    </article>
  );
}
