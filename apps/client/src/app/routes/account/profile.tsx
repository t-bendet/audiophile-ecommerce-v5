// app/account/page.tsx (or similar route)
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
// import { ProfileForm } from "@/components/account/profile-form";
// import { SecurityForm } from "@/components/account/security-form";

export default function ProfilePage() {
  return (
    <Container>
      <h1 className="mb-6 text-3xl font-bold">Account Settings</h1>
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
        {/* Add more TabsContent for Billing, Notifications, etc. */}
      </Tabs>
    </Container>
  );
}
