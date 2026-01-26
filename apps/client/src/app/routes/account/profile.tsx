// app/account/page.tsx (or similar route)
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getUserQueryOptions } from "@/lib/auth";
// import { ProfileForm } from "@/components/account/profile-form";
// import { SecurityForm } from "@/components/account/security-form";

// TODO implement actual forms and logic for profile and security

export default function ProfilePage() {
  // TODO usesuspense with a fallback loader
  const { data } = useSuspenseQuery(getUserQueryOptions());
  console.log({ data }, "profile page");

  return (
    <Container>
      <h1 className="mb-6 text-3xl font-bold">Account Settings</h1>
      <p className="text-muted-foreground mb-4">Logged in as: {data.email}</p>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <h1>Profile</h1>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <h1>Security</h1>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Container>
  );
}
