import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from "@/components/seo/metadata";
import { paths } from "@/config/paths";
import { listOrdersQueryOptions } from "@/features/orders/api/get-orders";
import { OrderCard } from "@/features/orders/components/order-card";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, LoaderFunctionArgs } from "react-router";

export default function OrdersPage() {
  const { data } = useSuspenseQuery(listOrdersQueryOptions());
  const orders = data.data;

  return (
    <Card>
      <Metadata title="Your Orders" noIndex />
      <CardHeader>
        <CardTitle>Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="flex flex-col items-start gap-4">
            <p className="text-neutral-600">You have no orders yet.</p>
            <Link to={paths.home.getHref()}>
              <Button variant="accent">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const clientLoader =
  (queryClient: QueryClient) => async (_context: LoaderFunctionArgs) => {
    await queryClient.ensureQueryData(listOrdersQueryOptions());
    return null;
  };
