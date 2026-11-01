import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import currencyFormatter from "@/utils/formatters";
import { StatsPeriodSchema, type StatsPeriod } from "@repo/domain";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { LoaderFunctionArgs, useSearchParams } from "react-router";
import { adminStatsQueryOptions } from "../api/get-admin-stats";
import { BestSellers } from "../components/best-sellers";
import { StatCard } from "../components/stat-card";
import { StatusBreakdown } from "../components/status-breakdown";
import { PERIOD_LABELS, PERIODS, readPeriod, toSearchParams } from "../period";

/** The dashboard's landing page: the shop's numbers over the chosen period. */
export default function AdminStatsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const period = readPeriod(searchParams);

  return (
    <>
      <div className="flex justify-end">
        <Tabs
          value={period}
          onValueChange={(value) =>
            setSearchParams(toSearchParams(StatsPeriodSchema.parse(value)))
          }
        >
          <TabsList aria-label="Period" className="h-10 bg-neutral-100 p-1">
            {PERIODS.map((value) => (
              <TabsTrigger
                key={value}
                value={value}
                className="px-4 text-xs font-bold tracking-600 uppercase data-[state=active]:bg-neutral-900 data-[state=active]:text-neutral-100 data-[state=active]:shadow-none"
              >
                {PERIOD_LABELS[value]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <SafeRenderWithErrorBlock title="Stats" fallback={<StatsSkeleton />}>
        <StatsResults period={period} />
      </SafeRenderWithErrorBlock>
    </>
  );
}

function StatsResults({ period }: { period: StatsPeriod }) {
  const { data } = useSuspenseQuery(adminStatsQueryOptions(period));
  const stats = data.data;

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Orders" value={stats.ordersCount.toLocaleString()} />
        <StatCard label="Revenue" value={currencyFormatter(stats.revenue)} />
        <StatCard
          label="New customers"
          value={stats.newUsers.toLocaleString()}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <StatusBreakdown ordersByStatus={stats.ordersByStatus} />
        <BestSellers products={stats.topProducts} />
      </div>
    </>
  );
}

function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="flex h-28 flex-col justify-center gap-4 rounded-lg border-t-4 border-primary-500 bg-neutral-100 p-6"
          >
            <Skeleton className="h-3 w-20 rounded-full bg-neutral-200" />
            <Skeleton className="h-8 w-32 rounded-full bg-neutral-200" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="flex h-80 flex-col gap-6 rounded-lg bg-neutral-100 p-6"
          >
            {Array.from({ length: 5 }, (_, row) => (
              <Skeleton key={row} className="h-3 rounded-full bg-neutral-200" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const period = readPeriod(new URL(request.url).searchParams);
    await queryClient.ensureQueryData(adminStatsQueryOptions(period));
    return null;
  };
