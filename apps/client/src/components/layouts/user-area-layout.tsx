import { Container } from "@/components/ui/container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { paths, TAccountPathKeys } from "@/config/paths";
import { getAuthStatusQueryOptions, getUserQueryOptions } from "@/lib/auth";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  LoaderFunctionArgs,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
} from "react-router";
import { SafeRenderWithErrorBlock } from "../errors/safe-render-with-error-block";

export default function UserAreaLayout() {
  const { data } = useSuspenseQuery(getUserQueryOptions());
  const { pathname } = useLocation();
  const [tab, setTab] = useState<TAccountPathKeys>(
    pathname.replace("/account/", "") as TAccountPathKeys,
  );
  const navigate = useNavigate();
  const handleTabChange = (value: string) => {
    setTab(value as TAccountPathKeys);
    navigate(paths.account[value as TAccountPathKeys].getHref());
  };
  useEffect(() => {
    const currentTab = pathname.replace("/account/", "") as TAccountPathKeys;
    setTab(currentTab);
  }, [pathname]);
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
          <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} defaultValue={tab} className="mt-4">
              <Outlet />
            </TabsContent>
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
    if (!authResponse.data.isAuthenticated) {
      // User is not logged in, redirect to login page
      const url = new URL(context.request.url);
      const redirectTo = url.pathname + url.search;
      throw redirect(paths.auth.login.getHref(redirectTo));
    }
    await queryClient.refetchQueries(getUserQueryOptions());
    return null;
  };
