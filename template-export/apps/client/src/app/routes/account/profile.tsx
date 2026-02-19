import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from "@/components/seo/metadata";
import { getUserQueryOptions } from "@/lib/auth";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { LoaderFunctionArgs } from "react-router";

export default function ProfilePage() {
  const { data } = useSuspenseQuery(getUserQueryOptions());
  return (
    <Card>
      <Metadata title="Your Profile" noIndex />
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <h1>{data.name}</h1>
      </CardContent>
    </Card>
  );
}

export const clientLoader =
  (_queryClient: QueryClient) => async (_context: LoaderFunctionArgs) => {
    // const userResponse = await queryClient.ensureQueryData(
    //   getUserQueryOptions(),
    // );
    return null;
  };
