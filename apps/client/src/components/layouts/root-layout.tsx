import { getCategoriesQueryOptions } from "@/features/categories/api/get-categories";
import {
  AUTH_LOGIN_MUTATION_KEY,
  AUTH_LOGOUT_MUTATION_KEY,
  AUTH_SIGNUP_MUTATION_KEY,
  getAuthStatusQueryOptions,
  USER_QUERY_KEY,
} from "@/lib/auth";
import {
  QueryClient,
  useIsFetching,
  useIsMutating,
} from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet, ScrollRestoration } from "react-router";
import LoadingSpinner from "../ui/loading-spinner";

export function RootLayout() {
  const isFetching = useIsFetching({ queryKey: [USER_QUERY_KEY] });
  const isMutating = useIsMutating({
    mutationKey: [
      AUTH_LOGIN_MUTATION_KEY,
      AUTH_LOGOUT_MUTATION_KEY,
      AUTH_SIGNUP_MUTATION_KEY,
    ],
  });

  const isLoading = isFetching + isMutating > 0;

  return (
    <div className="flex min-h-dvh flex-col">
      {isLoading && (
        <div className="absolute top-0 left-0 z-50 w-full bg-black/10">
          <div className="flex h-screen w-full items-center justify-center">
            <LoadingSpinner size="xl" />
          </div>
        </div>
      )}
      <ScrollRestoration />
      <Outlet />
    </div>
  );
}

export const clientLoader =
  (queryClient: QueryClient) => async (_context: LoaderFunctionArgs) => {
    await queryClient.ensureQueryData(getAuthStatusQueryOptions());
    await queryClient.prefetchQuery(getCategoriesQueryOptions());
    return null;
  };
