import { Metadata } from "@/components/seo/metadata";
import { Button } from "@/components/ui/button";
import { getOrderQueryOptions } from "@/features/orders/api/get-orders";
import { cn } from "@/lib/cn";
import currencyFormatter from "@/utils/formatters";
import type { OrderDTO } from "@repo/domain";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Check, ExternalLink } from "lucide-react";
import { LoaderFunctionArgs, useParams } from "react-router";
import {
  AddressPanels,
  BackToOrders,
  EventLine,
  ItemLines,
  ItemsPanel,
  Panel,
  StatusBadge,
  Totals,
  TrackingBlock,
} from "./order-parts";
import { sectionTitle } from "./shell";
import { useProto } from "./store";
import {
  STEP_LABEL,
  STEPS,
  buildTimeline,
  dateFormatter,
  dateTimeFormatter,
  shortOrderId,
  type Timeline,
} from "./timeline";

// Three layouts for /account/orders/:orderId, on the real order via GET /orders/:orderId.

type DetailProps = { order: OrderDTO; timeline: Timeline; showActor: boolean };

function Heading({ order, timeline }: Pick<DetailProps, "order" | "timeline">) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className={sectionTitle}>Order {shortOrderId(order.id)}</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Placed {dateFormatter.format(order.createdAt)} ·{" "}
          {currencyFormatter(order.total)}
        </p>
      </div>
      <StatusBadge status={timeline.status} />
    </div>
  );
}

function Stepper({ timeline }: { timeline: Timeline }) {
  if (timeline.status === "CANCELLED") {
    const [, cancelled] = timeline.events;
    return (
      <div className="rounded-lg bg-primary-700/10 p-6 text-primary-700">
        <p className="font-bold">{timeline.headline}</p>
        <p className="mt-1 text-sm">
          {cancelled && dateTimeFormatter.format(cancelled.at)}.{" "}
          {cancelled?.detail}
        </p>
      </div>
    );
  }
  const reached = STEPS.indexOf(timeline.status);
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((step, index) => {
        const done = index < reached;
        const current = index === reached;
        const event = timeline.events[index];
        return (
          <li key={step} className="relative flex flex-col items-center text-center">
            {index > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-3 right-1/2 left-[-50%] h-0.5",
                  index <= reached ? "bg-primary-500" : "bg-neutral-400",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-6 items-center justify-center rounded-full border-2",
                done && "border-primary-500 bg-primary-500 text-white",
                current && "border-primary-500 bg-white",
                !done && !current && "border-neutral-400 bg-white",
              )}
            >
              {done && <Check className="size-3.5" />}
              {current && <span className="size-2 rounded-full bg-primary-500" />}
            </span>
            <p
              className={cn(
                "mt-2 text-xs font-bold tracking-600 uppercase",
                !done && !current && "text-neutral-500",
              )}
            >
              {STEP_LABEL[step]}
            </p>
            <p className="text-xs text-neutral-500">
              {event ? dateFormatter.format(event.at) : "—"}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function DetailA({ order, timeline, showActor }: DetailProps) {
  const current = timeline.events[timeline.events.length - 1];
  return (
    <div className="flex flex-col gap-6">
      <Heading order={order} timeline={timeline} />
      <section aria-label="Status" className="flex flex-col gap-6 rounded-lg border border-neutral-400 p-6">
        <p className="font-bold">{timeline.headline}</p>
        <Stepper timeline={timeline} />
        {current && timeline.status !== "CANCELLED" && (
          <p className="text-sm text-neutral-500">
            {dateTimeFormatter.format(current.at)}
            {showActor && ` · ${current.actor === "you" ? "You" : current.actor === "store" ? "Audiophile" : "Carrier update"}`}
            {" · "}
            {current.detail}
          </p>
        )}
        {timeline.tracking && <TrackingBlock tracking={timeline.tracking} />}
      </section>
      <ItemsPanel order={order} />
      <AddressPanels order={order} />
    </div>
  );
}

function VerticalTimeline({ timeline, showActor }: Omit<DetailProps, "order">) {
  const last = timeline.events.length - 1;
  return (
    <ol className="flex flex-col">
      {timeline.events.map((event, index) => (
        <li key={event.status} className="relative flex gap-4 pb-6 last:pb-0">
          {index < last && (
            <span aria-hidden className="absolute top-3 bottom-0 left-[5px] w-0.5 bg-primary-500" />
          )}
          <span
            aria-hidden
            className={cn(
              "relative z-10 mt-1 size-3 shrink-0 rounded-full",
              index === last ? "bg-primary-500 ring-4 ring-primary-500/20" : "bg-primary-500",
            )}
          />
          <EventLine event={event} showActor={showActor} current={index === last} />
        </li>
      ))}
      {timeline.next && (
        <li className="relative flex gap-4 pt-0">
          <span aria-hidden className="absolute top-0 bottom-0 left-[5px] w-0.5 border-l-2 border-dashed border-neutral-400" />
          <span aria-hidden className="relative z-10 mt-1 size-3 shrink-0 rounded-full border-2 border-neutral-400 bg-white" />
          <p className="text-sm text-neutral-500">Next: {timeline.next}</p>
        </li>
      )}
    </ol>
  );
}

function DetailB({ order, timeline, showActor }: DetailProps) {
  return (
    <div className="flex flex-col gap-6">
      <Heading order={order} timeline={timeline} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex flex-col gap-6 lg:order-1">
          <ItemsPanel order={order} />
          <AddressPanels order={order} />
        </div>
        <div className="order-first flex flex-col gap-6 lg:sticky lg:top-6 lg:order-2">
          <Panel title="Status">
            <p className="font-bold">{timeline.headline}</p>
            <VerticalTimeline timeline={timeline} showActor={showActor} />
          </Panel>
          <p className="text-sm text-neutral-500">
            Something wrong with this order?{" "}
            <a href="mailto:support@audiophile.example" className="font-bold text-primary-500">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailC({ order, timeline, showActor }: DetailProps) {
  const events = [...timeline.events].reverse();
  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Status" className="rounded-lg bg-neutral-200 p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs font-bold tracking-600 text-neutral-500 uppercase">
            Order {shortOrderId(order.id)} · placed {dateFormatter.format(order.createdAt)}
          </p>
          <StatusBadge status={timeline.status} />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-300 uppercase md:text-3xl">
          {timeline.headline}
        </h2>
        {timeline.tracking ? (
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <TrackingBlock tracking={timeline.tracking} compact hideLink />
            <Button asChild variant="accent">
              <a href={timeline.tracking.url} target="_blank" rel="noreferrer">
                Track package
                <ExternalLink />
              </a>
            </Button>
          </div>
        ) : (
          timeline.next && (
            <p className="mt-4 text-sm text-neutral-500">Next: {timeline.next}</p>
          )
        )}
      </section>

      <section aria-label="History">
        <h3 className={sectionTitle}>History</h3>
        <ol className="mt-4 divide-y divide-neutral-400">
          {events.map((event, index) => (
            <li key={event.status} className="grid gap-1 py-4 md:grid-cols-[12rem_1fr] md:gap-6">
              <time dateTime={event.at.toISOString()} className="text-sm text-neutral-500">
                {dateTimeFormatter.format(event.at)}
              </time>
              <EventLine event={event} showActor={showActor} current={index === 0} hideDate />
            </li>
          ))}
        </ol>
      </section>

      <details open className="group rounded-lg bg-neutral-200 p-6">
        <summary className="flex cursor-pointer items-center justify-between text-xs font-bold tracking-600 text-neutral-500 uppercase">
          <span>Items ({order.items.length})</span>
          <span className="text-neutral-900">{currencyFormatter(order.total)}</span>
        </summary>
        <div className="mt-4">
          <ItemLines order={order} />
          <Totals order={order} />
        </div>
      </details>
      <details className="rounded-lg bg-neutral-200 p-6">
        <summary className="cursor-pointer text-xs font-bold tracking-600 text-neutral-500 uppercase">
          Delivery and billing
        </summary>
        <div className="mt-4 -mx-6 -mb-6">
          <AddressPanels order={order} />
        </div>
      </details>
    </div>
  );
}

const DETAILS = { A: DetailA, B: DetailB, C: DetailC } as const;

export default function PrototypeOrderDetailPage() {
  const { orderId = "" } = useParams();
  const { data } = useSuspenseQuery(getOrderQueryOptions(orderId));
  const order = data.data;
  const { detail, status, actor } = useProto();
  const timeline = buildTimeline(order, status);
  const Detail = DETAILS[detail];
  return (
    <>
      <Metadata title={`Order ${shortOrderId(order.id)}`} noIndex />
      <div className="mb-6">
        <BackToOrders />
      </div>
      <Detail order={order} timeline={timeline} showActor={actor === "shown"} />
    </>
  );
}

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    await queryClient.ensureQueryData(getOrderQueryOptions(params.orderId ?? ""));
    return null;
  };
