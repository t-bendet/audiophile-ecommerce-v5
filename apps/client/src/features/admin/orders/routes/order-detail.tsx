import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import { Metadata } from "@/components/seo/metadata";
import { Skeleton } from "@/components/ui/skeleton";
import { paths } from "@/config/paths";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, LoaderFunctionArgs, useParams } from "react-router";
import { adminOrderQueryOptions } from "../api/get-admin-orders";
import { FulfilmentForm } from "../components/fulfilment-form";
import { OrderSummary } from "../components/order-summary";
import { shortOrderId } from "../order-id";

export default function AdminOrderPage() {
  const { orderId = "" } = useParams();

  return (
    <>
      <Link
        to={paths.admin.orders.getHref()}
        aria-label="Back to orders"
        className="flex w-fit items-center gap-2 text-xs font-bold tracking-600 text-neutral-500 uppercase hover:text-primary-500"
      >
        <ArrowLeft className="size-4" />
        Orders
      </Link>
      <SafeRenderWithErrorBlock title="Order" fallback={<DetailSkeleton />}>
        <OrderDetail orderId={orderId} />
      </SafeRenderWithErrorBlock>
    </>
  );
}

function OrderDetail({ orderId }: { orderId: string }) {
  const { data } = useSuspenseQuery(adminOrderQueryOptions(orderId));
  const order = data.data;

  return (
    <>
      <Metadata title={`Order ${shortOrderId(order.id)} | Admin`} noIndex />
      <h2 className="text-lg font-bold tracking-200 uppercase">
        Order {shortOrderId(order.id)}
      </h2>
      {/* Below lg the Fulfilment panel comes first; from lg it is the sticky right column. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="lg:order-1">
          <OrderSummary order={order} />
        </div>
        <div className="lg:sticky lg:top-6 lg:order-2">
          <FulfilmentForm
            key={`${order.status}:${order.paymentStatus}`}
            order={order}
          />
        </div>
      </div>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
      aria-busy="true"
    >
      <Skeleton className="h-96 rounded-lg bg-neutral-100" />
      <Skeleton className="h-72 rounded-lg bg-neutral-100" />
    </div>
  );
}

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    await queryClient.ensureQueryData(
      adminOrderQueryOptions(params.orderId ?? ""),
    );
    return null;
  };
