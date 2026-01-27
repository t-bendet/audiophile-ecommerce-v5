import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs } from "react-router";

export default function SecurityPage() {
  return (
    <TabsContent value="security" className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <h1>Profile Information</h1>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

export const clientLoader =
  (_queryClient: QueryClient) => async (_context: LoaderFunctionArgs) => {
    return null;
  };
