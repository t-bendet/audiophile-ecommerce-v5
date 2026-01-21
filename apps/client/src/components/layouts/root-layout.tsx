import { USER_QUERY_KEY } from "@/lib/auth";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { Outlet, ScrollRestoration } from "react-router";

// TODO add AUTH_STATUS_QUERY_KEY based loading bar here to cover all pages

export function RootLayout() {
  const isFetching = useIsFetching({ queryKey: [USER_QUERY_KEY] });
  const isMutating = useIsMutating({ mutationKey: [USER_QUERY_KEY] });

  const isLoading = isFetching + isMutating > 0;

  // console.log({ isLoading, isFetching, isMutating });
  // TODO add auth loader state handling here(or globally), e.g. show a top loading bar when user auth state is being checked/refetched
  return (
    <div className="flex min-h-dvh flex-col">
      {isLoading && (
        <div className="bg-primary-500 fixed top-0 left-0 z-50 h-1.5 w-full animate-pulse" />
      )}
      <ScrollRestoration />
      <Outlet />
    </div>
  );
}
