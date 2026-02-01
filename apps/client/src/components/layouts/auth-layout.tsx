import { paths } from "@/config/paths";
import { getAuthStatusQueryOptions } from "@/lib/auth";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet, redirect } from "react-router";

const AuthLayout = () => {
  useQuery(getAuthStatusQueryOptions());
  return (
    <main className="bg-muted flex min-h-svh flex-col items-center gap-6 px-6 pt-10 md:pt-26">
      <Outlet />
    </main>
  );
};

export default AuthLayout;

export const clientLoader =
  (queryClient: QueryClient) => async (_context: LoaderFunctionArgs) => {
    const response = await queryClient.ensureQueryData(
      getAuthStatusQueryOptions(),
    );
    if (response.data.isAuthenticated) {
      // User is logged in, redirect to home page or dashboard
      throw redirect(paths.account.profile.path);
    }
    return null;
  };
