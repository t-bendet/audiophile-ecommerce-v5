import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Metadata } from "@/components/seo/metadata";
import { paths } from "@/config/paths";
import { OrderDTO, paymentInstructions } from "@repo/domain";
import { Link } from "react-router";

export function OrderConfirmation({ order }: { order: OrderDTO }) {
  return (
    <Container>
      <Metadata title="Order Confirmed" noIndex />
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold">Thank you for your order</h1>
        <p className="mb-8 text-neutral-600">
          We have received your order {order.id}.{" "}
          {paymentInstructions(order.paymentMethod)} We have sent a confirmation
          to {order.shippingAddress.email}.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to={paths.account.orders.getHref()}>
            <Button variant="accent">View your orders</Button>
          </Link>
          <Link to={paths.home.getHref()}>
            <Button variant="outline">Back to home</Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
