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
import { getAuthStatusQueryOptions } from "@/lib/auth";
import { syncLocalCartToServer } from "@/lib/cart-sync";
import currencyFormatter from "@/utils/formatters";
import { QueryClient } from "@tanstack/react-query";
import { Link, LoaderFunctionArgs, redirect } from "react-router";

export const clientLoader =
  (queryClient: QueryClient) => async (context: LoaderFunctionArgs) => {
    // Check if user is authenticated
    const authResponse = await queryClient.ensureQueryData(
      getAuthStatusQueryOptions(),
    );
    if (!authResponse.data.isAuthenticated) {
      // User is not logged in, redirect to login page with redirectTo parameter
      const url = new URL(context.request.url);
      const redirectTo = url.pathname + url.search;
      throw redirect(paths.auth.login.getHref(redirectTo));
    }

    // Sync local cart with server cart if user has local items
    await syncLocalCartToServer(queryClient);

    return null;
  };

export default function CheckoutPage() {
  const { data: cart, isLoading } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();

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
  const subtotal = cart?.data.subtotal || 0;
  const shipping = 50; // Fixed shipping cost in cents
  const tax = Math.round(subtotal * 0.2); // 20% tax
  const total = subtotal + shipping + tax;

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
            {/* Left Column - Form Placeholder */}
            <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
              <h2 className="mb-6 text-2xl font-bold">Billing Details</h2>
              <p className="mb-4 text-neutral-600">
                ⚠️ Checkout form coming soon! This page will include:
              </p>
              <ul className="mb-8 list-inside list-disc space-y-2 text-neutral-600">
                <li>Billing information form (name, email, address)</li>
                <li>Shipping information section</li>
                <li>Payment method selection</li>
                <li>Form validation</li>
              </ul>
              <p className="text-sm text-neutral-500">
                For now, the checkout page shows your cart summary and price
                calculations.
              </p>
            </div>

            {/* Right Column - Order Summary */}
            <div className="rounded-lg bg-white p-6 text-neutral-900 shadow">
              <h2 className="tracking-300 mb-6 text-xl font-bold uppercase">
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

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={() => {
                    alert(
                      "Checkout form and payment integration coming in next phase!",
                    );
                  }}
                >
                  Continue to Payment
                </Button>
                <Link to={paths.home.path} className="block">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
