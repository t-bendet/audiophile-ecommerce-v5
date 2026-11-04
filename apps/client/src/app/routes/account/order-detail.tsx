import { Metadata } from "@/components/seo/metadata";
import { Button } from "@/components/ui/button";
import { paths } from "@/config/paths";
import { getOrderQueryOptions } from "@/features/orders/api/get-orders";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { shortOrderId } from "@/features/orders/order-id";
import { trackingUrl } from "@/features/orders/tracking";
import { normalizeError } from "@/lib/errors/errors";
import currencyFormatter from "@/utils/formatters";
import { ErrorCode } from "@repo/domain";
import type {
  BillingAddress,
  OrderDTO,
  OrderStatus,
  ShippingAddress,
} from "@repo/domain";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { Link, LoaderFunctionArgs, useParams } from "react-router";
import { toast } from "sonner";

const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const dateTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});
const labels: Record<OrderStatus, string> = {
  PENDING: "Order placed",
  PROCESSING: "Being prepared",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
const headlines: Record<OrderStatus, string> = {
  PENDING: "We have received your order",
  PROCESSING: "Your order is being prepared",
  SHIPPED: "Your order is on its way",
  DELIVERED: "Your order was delivered",
  CANCELLED: "This order was cancelled",
};
const steps: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
const statusLabel = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase();

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-4 rounded-lg bg-neutral-200 p-6"
    >
      <h3 className="text-xs font-bold tracking-600 text-neutral-500 uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}
function Address({ address }: { address: ShippingAddress | BillingAddress }) {
  return (
    <address className="text-sm not-italic">
      <p className="font-bold">{address.fullName}</p>
      <p>{address.address}</p>
      <p>
        {address.city}, {address.state} {address.zipCode}
      </p>
      <p>{address.country}</p>
      {"phone" in address && <p className="mt-2">{address.phone}</p>}
      {"email" in address && <p>{address.email}</p>}
    </address>
  );
}
function Status({ order }: { order: OrderDTO }) {
  const events = [...order.events].sort(
    (a, b) => a.at.getTime() - b.at.getTime(),
  );
  const carrier =
    [...events].reverse().find((event) => event.status === "SHIPPED")
      ?.carrier ?? "the carrier";
  const next =
    order.status === "CANCELLED"
      ? undefined
      : steps[steps.indexOf(order.status) + 1];
  return (
    <Panel title="Status">
      <p className="font-bold">{headlines[order.status]}</p>
      <ol className="flex flex-col">
        {events.map((event, index) => {
          const current = index === events.length - 1;
          const detail =
            event.status === "PENDING"
              ? `You placed this order. We emailed a confirmation to ${order.shippingAddress.email}.`
              : event.status === "PROCESSING"
                ? order.paymentMethod === "Cash on Delivery"
                  ? `You pay ${currencyFormatter(order.total)} in cash when it arrives.`
                  : `We confirmed your payment of ${currencyFormatter(order.total)} by ${order.paymentMethod}.`
                : event.status === "SHIPPED"
                  ? `We handed it to ${event.carrier ?? "the carrier"}.`
                  : event.status === "DELIVERED"
                    ? `${carrier} confirmed delivery in ${order.shippingAddress.city}.`
                    : order.paymentStatus === "PAID" ||
                        order.paymentStatus === "REFUNDED"
                      ? `We cancelled this order. ${currencyFormatter(order.total)} will be refunded to your ${order.paymentMethod} account.`
                      : "We cancelled this order. Nothing was charged.";
          const url =
            event.carrier && event.trackingNumber
              ? trackingUrl(event.carrier, event.trackingNumber)
              : undefined;
          return (
            <li
              key={`${event.status}-${event.at.toISOString()}-${index}`}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {!current && (
                <span
                  aria-hidden
                  className="absolute top-3 bottom-0 left-[5px] w-0.5 bg-primary-500"
                />
              )}
              <span
                aria-hidden
                className={`relative z-10 mt-1 size-3 shrink-0 rounded-full bg-primary-500 ${current ? "ring-4 ring-primary-500/20" : ""}`}
              />
              <div className="flex flex-col gap-1">
                <p
                  className={`text-sm font-bold ${current ? "text-primary-500" : ""}`}
                >
                  {labels[event.status]}
                </p>
                <time
                  dateTime={event.at.toISOString()}
                  className="text-xs text-neutral-500"
                >
                  {dateTime.format(event.at)}
                </time>
                <p className="text-sm">{detail}</p>
                {event.status === "SHIPPED" &&
                  event.carrier &&
                  event.trackingNumber && (
                    <div>
                      <p className="text-sm">
                        Shipped with <b>{event.carrier}</b>
                      </p>
                      <p className="font-mono text-sm">
                        {event.trackingNumber}{" "}
                        <button
                          type="button"
                          aria-label="Copy tracking number"
                          onClick={() => {
                            void navigator.clipboard
                              .writeText(event.trackingNumber!)
                              .then(() =>
                                toast.success("Tracking number copied"),
                              );
                          }}
                        >
                          <Copy className="size-4" />
                        </button>
                      </p>
                      {url && (
                        <Button asChild variant="link" size="sm">
                          <a href={url} target="_blank" rel="noreferrer">
                            Track package <ExternalLink />
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
              </div>
            </li>
          );
        })}
        {next && (
          <li className="flex gap-4">
            <span
              aria-hidden
              className="mt-1 size-3 shrink-0 rounded-full border-2 border-neutral-400"
            />
            <p className="text-sm text-neutral-500">Next: {labels[next]}</p>
          </li>
        )}
      </ol>
    </Panel>
  );
}
export default function OrderDetailPage() {
  const { orderId = "" } = useParams();
  const { data } = useSuspenseQuery(getOrderQueryOptions(orderId));
  const order = data.data;
  return (
    <div className="flex flex-col gap-6">
      <Metadata title={`Order ${shortOrderId(order.id)}`} noIndex />
      <Link
        to={paths.account.orders.getHref()}
        className="flex w-fit items-center gap-2 text-xs font-bold tracking-600 text-neutral-500 uppercase hover:text-primary-500"
      >
        <ArrowLeft className="size-4" />
        Orders
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-200 uppercase">
            Order {shortOrderId(order.id)}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Placed {date.format(order.createdAt)} ·{" "}
            {currencyFormatter(order.total)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex flex-col gap-6 lg:order-1">
          <Panel title="Items">
            <ul className="divide-y divide-neutral-400">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  <img
                    src={item.productImage.src}
                    alt=""
                    width={item.productImage.width}
                    height={item.productImage.height}
                    className="size-14 rounded object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold uppercase">
                      {item.productName}
                    </h4>
                    <p className="text-sm text-neutral-500">
                      {currencyFormatter(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-bold">
                    {currencyFormatter(item.subtotal)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="flex flex-col gap-2 border-t border-neutral-400 pt-4 text-sm">
              {(
                [
                  ["Subtotal", order.subtotal],
                  ["Shipping", order.shippingCost],
                  ["Tax", order.tax],
                ] as const
              ).map(([label, amount]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-neutral-500">{label}</dt>
                  <dd className="font-bold">{currencyFormatter(amount)}</dd>
                </div>
              ))}
              <div className="flex justify-between text-base font-bold">
                <dt>Grand total</dt>
                <dd className="text-primary-500">
                  {currencyFormatter(order.total)}
                </dd>
              </div>
            </dl>
          </Panel>
          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Ships to">
              <Address address={order.shippingAddress} />
            </Panel>
            <Panel title="Billed to">
              <Address address={order.billingAddress} />
              <p className="text-sm text-neutral-500">
                {order.paymentMethod} · {statusLabel(order.paymentStatus)}
              </p>
            </Panel>
          </div>
        </div>
        <div className="order-first flex flex-col gap-6 lg:sticky lg:top-6 lg:order-2">
          <Status order={order} />
          <p className="text-sm text-neutral-500">
            Something wrong with this order?{" "}
            <a
              href="mailto:support@audiophile.example"
              className="font-bold text-primary-500"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    try {
      await queryClient.ensureQueryData(
        getOrderQueryOptions(params.orderId ?? ""),
      );
    } catch (error) {
      if (normalizeError(error).code === ErrorCode.FORBIDDEN)
        throw new Response(null, { status: 404 });
      throw error;
    }
    return null;
  };
