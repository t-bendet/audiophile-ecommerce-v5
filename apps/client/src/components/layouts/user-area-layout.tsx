import { Container } from "@/components/ui/container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { paths, TAccountPathKeys } from "@/config/paths";
import { getUserQueryOptions } from "@/lib/auth";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Outlet, useLocation, useNavigate } from "react-router";
import { SafeRenderWithErrorBlock } from "../errors/safe-render-with-error-block";

export default function UserAreaLayout() {
  const { data } = useSuspenseQuery(getUserQueryOptions());
  const { pathname } = useLocation();
  const tab = pathname.replace("/account/", "") as TAccountPathKeys;
  const navigate = useNavigate();
  const handleTabChange = (value: string) => {
    void navigate(paths.account[value as TAccountPathKeys].getHref());
  };
  return (
    <main className="flex min-h-dvh flex-col">
      <SafeRenderWithErrorBlock
        title="Error loading User details"
        containerClasses="mb-40"
      >
        <Container>
          <h1 className="mb-6 text-3xl font-bold">Account Settings</h1>
          <p className="mb-4 text-muted-foreground">
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
