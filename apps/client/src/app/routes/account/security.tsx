import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs } from "react-router";

export default function SecurityPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Information</CardTitle>
      </CardHeader>
      <CardContent>
        <h1>Security Information</h1>
      </CardContent>
    </Card>
  );
}

export const clientLoader =
  (_queryClient: QueryClient) => async (_context: LoaderFunctionArgs) => {
    return null;
  };
