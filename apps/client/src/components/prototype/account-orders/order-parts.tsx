import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { paths } from "@/config/paths";
import { cn } from "@/lib/cn";
import currencyFormatter from "@/utils/formatters";
import type {
  BillingAddress,
  OrderDTO,
  OrderStatus,
  ShippingAddress,
} from "@repo/domain";
import { ArrowLeft, Copy, ExternalLink, Truck } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { panelTitle } from "./shell";
import {
  ACTOR_LABEL,
  dateTimeFormatter,
  statusLabel,
  type TimelineEvent,
  type Tracking,
} from "./timeline";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={status.toLowerCase() as Lowercase<OrderStatus>}>
      {statusLabel(status)}
    </Badge>
  );
}

export function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={cn("flex flex-col gap-4 rounded-lg bg-neutral-200 p-6", className)}
    >
      <h3 className={panelTitle}>{title}</h3>
      {children}
    </section>
  );
}

export function BackToOrders() {
  return (
    <Link
      to={paths.account.orders.getHref()}
      className="flex w-fit items-center gap-2 text-xs font-bold tracking-600 text-neutral-500 uppercase hover:text-primary-500"
    >
      <ArrowLeft className="size-4" />
      Orders
    </Link>
  );
}

export function ItemLines({ order }: { order: OrderDTO }) {
  return (
    <ul className="divide-y divide-neutral-400">
      {order.items.map((item) => (
        <li key={item.id} className="flex items-center gap-4 py-3">
          <img
            src={item.productImage.src}
            alt=""
            width={item.productImage.width}
            height={item.productImage.height}
            className="size-14 rounded bg-neutral-400 object-cover"
          />
          <div className="flex-1">
            <h4 className="text-sm font-bold uppercase">{item.productName}</h4>
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
  );
}

export function Totals({ order }: { order: OrderDTO }) {
  const totals = [
    ["Subtotal", order.subtotal],
    ["Shipping", order.shippingCost],
    ["Tax", order.tax],
  ] as const;
  return (
    <dl className="flex flex-col gap-2 border-t border-neutral-400 pt-4 text-sm">
      {totals.map(([label, amount]) => (
        <div key={label} className="flex justify-between">
          <dt className="text-neutral-500">{label}</dt>
          <dd className="font-bold">{currencyFormatter(amount)}</dd>
        </div>
      ))}
      <div className="flex justify-between text-base">
        <dt className="font-bold">Grand total</dt>
        <dd className="font-bold text-primary-500">
          {currencyFormatter(order.total)}
        </dd>
      </div>
    </dl>
  );
}

export function ItemsPanel({ order }: { order: OrderDTO }) {
  return (
    <Panel title={`Items (${order.items.length})`}>
      <ItemLines order={order} />
      <Totals order={order} />
    </Panel>
  );
}

function AddressLines({
  address,
}: {
  address: ShippingAddress | BillingAddress;
}) {
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

export function AddressPanels({ order }: { order: OrderDTO }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Panel title="Ships to">
        <AddressLines address={order.shippingAddress} />
      </Panel>
      <Panel title="Billed to">
        <AddressLines address={order.billingAddress} />
        <p className="text-sm text-neutral-500">
          {order.paymentMethod} · {statusLabel(order.paymentStatus)}
        </p>
      </Panel>
    </div>
  );
}

export function TrackingBlock({
  tracking,
  compact = false,
  hideLink = false,
}: {
  tracking: Tracking;
  compact?: boolean;
  hideLink?: boolean;
}) {
  const copy = () => {
    void navigator.clipboard?.writeText(tracking.number);
    toast.success("Tracking number copied");
  };
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-3",
        !compact && "rounded-lg bg-neutral-200 p-6",
      )}
    >
      {!compact && <Truck className="size-6 text-primary-500" />}
      <div className="flex-1">
        <p className="text-sm">
          Shipped with <span className="font-bold">{tracking.carrier}</span>
        </p>
        <p className="font-mono text-sm">
          {tracking.number}
          <button
            type="button"
            onClick={copy}
            aria-label="Copy tracking number"
            className="ml-2 inline-flex align-middle text-neutral-500 hover:text-primary-500"
          >
            <Copy className="size-4" />
          </button>
        </p>
      </div>
      {!hideLink && (
        <Button asChild variant={compact ? "link" : "outline"} size="sm">
          <a href={tracking.url} target="_blank" rel="noreferrer">
            Track package
            <ExternalLink />
          </a>
        </Button>
      )}
    </div>
  );
}

export function EventLine({
  event,
  showActor,
  current,
  hideDate = false,
}: {
  event: TimelineEvent;
  showActor: boolean;
  current: boolean;
  hideDate?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className={cn("text-sm font-bold", current && "text-primary-500")}>
        {event.title}
      </p>
      {(!hideDate || showActor) && (
        <p className="text-xs text-neutral-500">
          {!hideDate && (
            <time dateTime={event.at.toISOString()}>
              {dateTimeFormatter.format(event.at)}
            </time>
          )}
          {showActor && `${hideDate ? "" : " · "}${ACTOR_LABEL[event.actor]}`}
        </p>
      )}
      <p className="text-sm">{event.detail}</p>
      {event.tracking && <TrackingBlock tracking={event.tracking} compact />}
    </div>
  );
}
