import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import { Metadata } from "@/components/seo/metadata";
import { Skeleton } from "@/components/ui/skeleton";
import { paths } from "@/config/paths";
import { getUserQueryOptions } from "@/lib/auth";
import { QueryClient, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, LoaderFunctionArgs, useParams } from "react-router";
import { adminOrdersQueryOptions } from "../../orders/api/get-admin-orders";
import { adminUserQueryOptions } from "../api/get-admin-users";
import { AccountPanel } from "../components/account-panel";
import { UserOrders } from "../components/user-orders";

export default function AdminUserPage() {
  const { userId = "" } = useParams();

  return (
    <>
      <Link
        to={paths.admin.users.getHref()}
        aria-label="Back to users"
        className="flex w-fit items-center gap-2 text-xs font-bold tracking-600 text-neutral-500 uppercase hover:text-primary-500"
      >
        <ArrowLeft className="size-4" />
        Users
      </Link>
      <SafeRenderWithErrorBlock title="User" fallback={<DetailSkeleton />}>
        <UserDetail userId={userId} />
      </SafeRenderWithErrorBlock>
    </>
  );
}

function UserDetail({ userId }: { userId: string }) {
  const { data } = useSuspenseQuery(adminUserQueryOptions(userId));
  const { data: admin } = useQuery(getUserQueryOptions());
  const user = data.data;

  return (
    <>
      <Metadata title={`${user.name} | Admin`} noIndex />
      <h2 className="text-lg font-bold tracking-200 uppercase">{user.name}</h2>
      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <AccountPanel user={user} isSelf={admin?.id === user.id} />
        <UserOrders userId={user.id} />
      </div>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div
      className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]"
      aria-busy="true"
    >
      <Skeleton className="h-72 rounded-lg bg-neutral-100" />
      <Skeleton className="h-96 rounded-lg bg-neutral-100" />
    </div>
  );
}

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const userId = params.userId ?? "";
    await Promise.all([
      queryClient.ensureQueryData(adminUserQueryOptions(userId)),
      queryClient.ensureQueryData(adminOrdersQueryOptions({ userId })),
    ]);
    return null;
  };
