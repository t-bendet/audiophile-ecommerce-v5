import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { paths } from "@/config/paths";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, LoaderFunctionArgs, useSearchParams } from "react-router";
import { ListPagination } from "../../components/list-pagination";
import { adminUsersQueryOptions } from "../api/get-admin-users";
import { UsersFilters } from "../components/users-filters";
import { UsersTable } from "../components/users-table";
import {
  AdminUserFilters,
  hasActiveFilters,
  readUserFilters,
  toSearchParams,
} from "../filters";

export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readUserFilters(searchParams);
  const navigateTo = (next: AdminUserFilters) =>
    setSearchParams(toSearchParams(next));

  return (
    <>
      <UsersFilters
        key={searchParams.toString()}
        filters={filters}
        onApply={navigateTo}
      />
      <SafeRenderWithErrorBlock title="Users" fallback={<UsersSkeleton />}>
        <UsersResults
          filters={filters}
          onPage={(page) => navigateTo({ ...filters, page })}
        />
      </SafeRenderWithErrorBlock>
    </>
  );
}

function UsersResults({
  filters,
  onPage,
}: {
  filters: AdminUserFilters;
  onPage: (page: number) => void;
}) {
  const { data } = useSuspenseQuery(adminUsersQueryOptions(filters));

  if (data.data.length === 0) {
    return <EmptyUsers filtered={hasActiveFilters(filters)} />;
  }

  return (
    <>
      <UsersTable users={data.data} />
      <ListPagination meta={data.meta} onPage={onPage} />
    </>
  );
}

function EmptyUsers({ filtered }: { filtered: boolean }) {
  return (
    <section className="flex flex-col items-start gap-4 rounded-lg bg-neutral-100 p-6">
      <h2 className="text-xs font-bold tracking-600 uppercase">
        Nothing here yet
      </h2>
      <p className="text-sm text-neutral-500">
        {filtered
          ? "No user matches these filters."
          : "Users appear here as shoppers sign up."}
      </p>
      {filtered && (
        <Button variant="accent" asChild>
          <Link to={paths.admin.users.getHref()}>Clear filters</Link>
        </Button>
      )}
    </section>
  );
}

function UsersSkeleton() {
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
    const filters = readUserFilters(new URL(request.url).searchParams);
    await queryClient.ensureQueryData(adminUsersQueryOptions(filters));
    return null;
  };
