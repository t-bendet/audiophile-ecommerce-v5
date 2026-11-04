import { Metadata } from "@/components/seo/metadata";
import { Button } from "@/components/ui/button";
import { paths } from "@/config/paths";
import { listOrdersQueryOptions } from "@/features/orders/api/get-orders";
import currencyFormatter from "@/utils/formatters";
import type { OrderDTO } from "@repo/domain";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { Link, LoaderFunctionArgs } from "react-router";
import { StatusBadge } from "./order-parts";
import { sectionTitle } from "./shell";
import { useProto } from "./store";
import { dateFormatter, shortOrderId, statusLabel } from "./timeline";

export const orderHref = (orderId: string) => `/account/orders/${orderId}`;

// Two ways a card links to its detail page: the heading is the link, or a
// "View order" button in the footer. Both keep the article role, the
// product-name headings and the payment-method text the E2E suite reads.

function OrderCard({ order, link }: { order: OrderDTO; link: string }) {
  const headingId = `order-${order.id}`;
  return (
    <article
      aria-labelledby={headingId}
      className="rounded-lg border border-neutral-400 p-6 text-neutral-900"
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id={headingId} className="font-bold">
            {link === "heading" ? (
              <Link
                to={orderHref(order.id)}
                className="inline-flex items-center gap-1 hover:text-primary-500"
              >
                Order {shortOrderId(order.id)}
                <ChevronRight className="size-4" />
              </Link>
            ) : (
              `Order ${shortOrderId(order.id)}`
            )}
          </h3>
          <p className="text-sm text-neutral-500">
            Ordered {dateFormatter.format(order.createdAt)} · {order.paymentMethod} ·{" "}
            {statusLabel(order.paymentStatus)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      <ul className="divide-y divide-neutral-400">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-3">
            <img
              src={item.productImage.src}
              alt=""
              width={item.productImage.width}
              height={item.productImage.height}
              className="size-12 rounded bg-neutral-200 object-cover"
            />
            <div className="flex-1">
              <h4 className="text-sm font-bold uppercase">{item.productName}</h4>
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

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-400 pt-4">
        <p className="font-bold">
          Total{" "}
          <span className="ml-2 text-primary-500">
            {currencyFormatter(order.total)}
          </span>
        </p>
        {link === "button" && (
          <Button asChild variant="outline" size="sm">
            <Link to={orderHref(order.id)}>View order</Link>
          </Button>
        )}
      </footer>
    </article>
  );
}

export default function PrototypeOrdersPage() {
  const { data } = useSuspenseQuery(listOrdersQueryOptions());
  const { link } = useProto();
  const orders = data.data;

  return (
    <>
      <Metadata title="Your Orders" noIndex />
      <h2 className={sectionTitle}>Orders</h2>
      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-start gap-4">
          <p className="text-neutral-500">You have no orders yet.</p>
          <Button asChild variant="accent">
            <Link to={paths.home.getHref()}>Continue Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} link={link} />
          ))}
        </div>
      )}
    </>
  );
}

export const clientLoader =
  (queryClient: QueryClient) => async (_context: LoaderFunctionArgs) => {
    await queryClient.ensureQueryData(listOrdersQueryOptions());
    return null;
  };
