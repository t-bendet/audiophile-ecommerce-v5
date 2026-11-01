import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { paths } from "@/config/paths";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, LoaderFunctionArgs, useSearchParams } from "react-router";
import { adminOrdersQueryOptions } from "../api/get-admin-orders";
import { ListPagination } from "../../components/list-pagination";
import { OrdersFilters } from "../components/orders-filters";
import { OrdersTable } from "../components/orders-table";
import {
  AdminOrderFilters,
  hasActiveFilters,
  readOrderFilters,
  toSearchParams,
} from "../filters";

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readOrderFilters(searchParams);
  const navigateTo = (next: AdminOrderFilters) =>
    setSearchParams(toSearchParams(next));

  return (
    <>
      <OrdersFilters
        key={searchParams.toString()}
        filters={filters}
        onApply={navigateTo}
      />
      <SafeRenderWithErrorBlock title="Orders" fallback={<OrdersSkeleton />}>
        <OrdersResults
          filters={filters}
          onPage={(page) => navigateTo({ ...filters, page })}
        />
      </SafeRenderWithErrorBlock>
    </>
  );
}

function OrdersResults({
  filters,
  onPage,
}: {
  filters: AdminOrderFilters;
  onPage: (page: number) => void;
}) {
  const { data } = useSuspenseQuery(adminOrdersQueryOptions(filters));

  if (data.data.length === 0) {
    return <EmptyOrders filtered={hasActiveFilters(filters)} />;
  }

  return (
    <>
      <OrdersTable orders={data.data} />
      <ListPagination meta={data.meta} onPage={onPage} />
    </>
  );
}

function EmptyOrders({ filtered }: { filtered: boolean }) {
  return (
    <section className="flex flex-col items-start gap-4 rounded-lg bg-neutral-100 p-6">
      <h2 className="text-xs font-bold tracking-600 uppercase">
        Nothing here yet
      </h2>
      <p className="text-sm text-neutral-500">
        {filtered
          ? "No order matches these filters."
          : "Orders appear here as shoppers check out."}
      </p>
      {filtered && (
        <Button variant="accent" asChild>
          <Link to={paths.admin.orders.getHref()}>Clear filters</Link>
        </Button>
      )}
    </section>
  );
}

function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="flex h-16 items-center gap-6 rounded-lg bg-neutral-100 px-6"
        >
          <Skeleton className="h-3 w-24 rounded-full bg-neutral-200" />
          <Skeleton className="h-3 flex-1 rounded-full bg-neutral-200" />
          <Skeleton className="h-3 w-16 rounded-full bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const filters = readOrderFilters(new URL(request.url).searchParams);
    await queryClient.ensureQueryData(adminOrdersQueryOptions(filters));
    return null;
  };
