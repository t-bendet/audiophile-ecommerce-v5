import { getCategoriesQueryOptions } from "@/features/categories/api/get-categories";
import { AUTH_LOGOUT_MUTATION_KEY } from "@/lib/auth";
import { QueryClient, useIsMutating } from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet, ScrollRestoration } from "react-router";
import { Metadata } from "@/components/seo/metadata";
import LoadingSpinner from "../ui/loading-spinner";
// PROTOTYPE (#0)
import { PrototypeSwitcher } from "@/components/prototype/account-orders/switcher";

export function RootLayout() {
  // Logout only: the auth forms and navigations show their own pending state.
  const isMutating = useIsMutating({
    mutationKey: [AUTH_LOGOUT_MUTATION_KEY],
  });

  const isLoading = isMutating > 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <Metadata />
      {isLoading && (
        <div className="absolute top-0 left-0 z-50 w-full bg-black/10">
          <div className="flex h-screen w-full items-center justify-center">
            <LoadingSpinner size="xl" />
          </div>
        </div>
      )}
      <ScrollRestoration />
      <Outlet />
      {/* PROTOTYPE (#0) */}
      {import.meta.env.DEV && <PrototypeSwitcher />}
    </div>
  );
}

export function RootHydrateFallback() {
  return (
    <div className="flex min-h-dvh flex-col">
      <LoadingSpinner size="xl" className="flex-1" />
    </div>
  );
}

export const clientLoader =
  (queryClient: QueryClient) => async (_context: LoaderFunctionArgs) => {
    await queryClient.prefetchQuery(getCategoriesQueryOptions());
    return null;
  };
