import { paths } from "@/config/paths";
import { getAuthStatusQueryOptions, getUserQueryOptions } from "@/lib/auth";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet, redirect } from "react-router";
import { SafeRenderWithErrorBlock } from "../errors/safe-render-with-error-block";

export default function UserAreaLayout() {
  return (
    <main className="flex min-h-dvh flex-col">
      <SafeRenderWithErrorBlock
        title="Error loading User details"
        containerClasses="mb-40"
      >
        <Outlet />
      </SafeRenderWithErrorBlock>
    </main>
  );
}

export const clientLoader =
  (queryClient: QueryClient) => async (context: LoaderFunctionArgs) => {
    const authResponse = await queryClient.ensureQueryData(
      getAuthStatusQueryOptions(),
    );
    if (!authResponse.data.isAuthenticated) {
      // User is not logged in, redirect to login page
      const url = new URL(context.request.url);
      const redirectTo = url.pathname + url.search;
      throw redirect(paths.auth.login.getHref(redirectTo));
    }
    await queryClient.prefetchQuery(getUserQueryOptions());
    return null;
  };
