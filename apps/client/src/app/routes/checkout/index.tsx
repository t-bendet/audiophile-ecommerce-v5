import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Section } from "@/components/ui/section";
import { Metadata } from "@/components/seo/metadata";
import { paths } from "@/config/paths";
import {
  useCart,
  useRemoveFromCart,
  useUpdateCartItem,
} from "@/features/cart/api/get-cart";
import { CartItem } from "@/features/cart/components/cart-item";
import { CheckoutForm } from "@/features/orders/components/checkout-form";
import { OrderConfirmation } from "@/features/orders/components/order-confirmation";
import { syncGuestCartToServer } from "@/lib/cart-sync";
import currencyFormatter from "@/utils/formatters";
import { calculateOrderTotals, OrderDTO } from "@repo/domain";
import { QueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, LoaderFunctionArgs } from "react-router";

export const clientLoader =
  (queryClient: QueryClient) => async (_context: LoaderFunctionArgs) => {
    await syncGuestCartToServer(queryClient);
    return null;
  };

export default function CheckoutPage() {
  const { data: cart, isLoading } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();
  const [createdOrder, setCreatedOrder] = useState<OrderDTO | null>(null);

  const handleUpdateQuantity = (
    productId: string,
    cartItemId: string,
    quantity: number,
  ) => {
    updateCartItem.mutate({ productId, cartItemId, quantity });
  };

  const handleRemove = (productId: string, cartItemId: string) => {
    removeFromCart.mutate({ productId, cartItemId });
  };

  const isUpdating = updateCartItem.isPending || removeFromCart.isPending;

  // Calculate totals
  const {
    subtotal,
    shippingCost: shipping,
    tax,
    total,
  } = calculateOrderTotals(cart?.data.subtotal || 0);

  // The created order wins over the now-empty cart the mutation leaves behind.
  if (createdOrder) {
    return <OrderConfirmation order={createdOrder} />;
  }

  if (isLoading) {
    return (
      <Container>
        <Metadata title="Checkout" noIndex />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </Container>
    );
  }

  if (!cart?.data.items || cart.data.items.length === 0) {
    return (
      <Container>
        <Metadata title="Checkout" noIndex />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h1 className="mb-4 text-3xl font-bold">Your cart is empty</h1>
          <p className="mb-8 text-neutral-600">
            Add items to your cart to continue to checkout
          </p>
          <Link to={paths.home.path}>
            <Button variant="accent">Continue Shopping</Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <main>
      <Metadata title="Checkout" noIndex />
      <div className="bg-neutral-900 py-8">
        <Container>
          <h1 className="text-3xl font-bold text-white">Checkout</h1>
        </Container>
      </div>

      <Section>
        <Container>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-6 text-neutral-900 shadow lg:col-span-2">
              <CheckoutForm onOrderCreated={setCreatedOrder} />
            </div>

            {/* Right Column - Order Summary */}
            <div className="rounded-lg bg-white p-6 text-neutral-900 shadow">
              <h2 className="mb-6 text-xl font-bold tracking-300 uppercase">
                summary
              </h2>

              {/* Cart Items */}
              <div className="mb-6 text-neutral-900">
                {cart.data.items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemove}
                    isUpdating={isUpdating}
                    withActions={false}
                  />
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t pt-4 text-neutral-600">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="font-medium">
                    {currencyFormatter(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Shipping</span>
                  <span className="font-medium">
                    {currencyFormatter(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Tax (20%)</span>
                  <span className="font-medium">{currencyFormatter(tax)}</span>
                </div>
                <div className="flex justify-between border-t pt-3 text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary-500">
                    {currencyFormatter(total)}
                  </span>
                </div>
              </div>

              <Link to={paths.home.path} className="mt-6 block">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
