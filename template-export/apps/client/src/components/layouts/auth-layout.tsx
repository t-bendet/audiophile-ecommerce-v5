import { Button } from "@/components/ui/button";
import { paths } from "@/config/paths";
import { getAuthStatusQueryOptions } from "@/lib/auth";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, LoaderFunctionArgs, Outlet, redirect } from "react-router";
import { Container } from "../ui/container";

// TODO improve styling and add some graphics to make it look better

const AuthLayout = () => {
  useQuery(getAuthStatusQueryOptions());
  return (
    <main className="bg-muted flex min-h-svh flex-col items-center gap-6 px-6 pt-10 md:pt-26">
      <Container classes="w-full max-w-md">
        <Button variant="link" asChild className="mb-4 gap-2 px-0">
          <Link to={paths.home.getHref()}>
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
        </Button>
      </Container>
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
