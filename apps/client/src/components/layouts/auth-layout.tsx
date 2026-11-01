import { currentUserContext } from "@/app/middleware/auth";
import { Button } from "@/components/ui/button";
import { paths } from "@/config/paths";
import { getAuthStatusQueryOptions } from "@/lib/auth";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, LoaderFunctionArgs, Outlet, redirect } from "react-router";
import { Container } from "../ui/container";

const AuthLayout = () => {
  useQuery(getAuthStatusQueryOptions());
  return (
    <main className="flex min-h-svh flex-col items-center gap-6 bg-muted px-6 pt-10 md:pt-26">
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
  (_queryClient: QueryClient) =>
  async ({ context }: LoaderFunctionArgs) => {
    if (context.get(currentUserContext)) {
      // Already signed in: there is nothing to log in to.
      throw redirect(paths.account.profile.path);
    }
    return null;
  };
