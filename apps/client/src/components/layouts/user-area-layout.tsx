import { Container } from "@/components/ui/container";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { paths } from "@/config/paths";
import { getAuthStatusQueryOptions, getUserQueryOptions } from "@/lib/auth";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  LoaderFunctionArgs,
  Outlet,
  redirect,
  useNavigate,
} from "react-router";
import { SafeRenderWithErrorBlock } from "../errors/safe-render-with-error-block";

export default function UserAreaLayout() {
  const { data } = useSuspenseQuery(getUserQueryOptions());
  const navigate = useNavigate();
  console.log(data);
  return (
    <main className="flex min-h-dvh flex-col">
      <SafeRenderWithErrorBlock
        title="Error loading User details"
        containerClasses="mb-40"
      >
        <Container>
          <h1 className="mb-6 text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mb-4">
            Logged in as: {data.email}
          </p>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList>
              <TabsTrigger
                value="profile"
                onClick={() => navigate(paths.account.profile.getHref())}
              >
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="security"
                onClick={() => navigate(paths.account.security.getHref())}
              >
                Security
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                onClick={() => navigate(paths.account.orders.getHref())}
              >
                Orders
              </TabsTrigger>
            </TabsList>
            <Outlet />
          </Tabs>
        </Container>
      </SafeRenderWithErrorBlock>
    </main>
  );
}

export const clientLoader =
  (queryClient: QueryClient) => async (context: LoaderFunctionArgs) => {
    const authResponse = await queryClient.ensureQueryData(
      getAuthStatusQueryOptions(),
    );
    console.log({ authResponse });
    if (!authResponse.data.isAuthenticated) {
      // User is not logged in, redirect to login page
      const url = new URL(context.request.url);
      const redirectTo = url.pathname + url.search;
      throw redirect(paths.auth.login.getHref(redirectTo));
    }
    await queryClient.refetchQueries(getUserQueryOptions());
    return null;
  };
