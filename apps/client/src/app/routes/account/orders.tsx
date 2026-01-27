import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs } from "react-router";

export default function OrdersPage() {
  return (
    <TabsContent value="orders" className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <h1>Orders</h1>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

export const clientLoader =
  (_queryClient: QueryClient) => async (_context: LoaderFunctionArgs) => {
    return null;
  };

//   <Container>
//   <h1 className="mb-6 text-3xl font-bold">Account Settings</h1>
//   <p className="text-muted-foreground mb-4">Logged in as: {data.email}</p>
//   <Tabs defaultValue="profile" className="w-full">
//     <TabsList>
//       <TabsTrigger value="profile">Profile</TabsTrigger>
//       <TabsTrigger value="security">Security</TabsTrigger>
//       <TabsTrigger value="billing">Billing</TabsTrigger>
//     </TabsList>
//     <TabsContent value="profile" className="mt-4">
//       <Card>
//         <CardHeader>
//           <CardTitle>Profile Information</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <h1>Profile</h1>
//         </CardContent>
//       </Card>
//     </TabsContent>
//     <TabsContent value="security" className="mt-4">
//       <Card>
//         <CardHeader>
//           <CardTitle>Change Password</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <h1>Security</h1>
//         </CardContent>
//       </Card>
//     </TabsContent>
//   </Tabs>
// </Container>
