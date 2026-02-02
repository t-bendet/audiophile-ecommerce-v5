import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { paths } from "@/config/paths";
import { useCart } from "@/features/cart/api/get-cart";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Link } from "react-router";
import { CartItem } from "@/features/cart/components/cart-item";
import { useRemoveFromCart, useUpdateCartItem } from "@/features/cart/api/get-cart";

export default function CheckoutPage() {
  const { data: cart, isLoading } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();

  const handleUpdateQuantity = (cartItemId: string, quantity: number) => {
    updateCartItem.mutate({ cartItemId, quantity });
  };

  const handleRemove = (cartItemId: string) => {
    removeFromCart.mutate(cartItemId);
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
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </Container>
    );
  }

  if (!cart?.data.items || cart.data.items.length === 0) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-neutral-600 mb-8">
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
      <div className="bg-neutral-900 py-8">
        <Container>
          <h1 className="text-3xl font-bold text-white">Checkout</h1>
        </Container>
      </div>

      <Section>
        <Container>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Form Placeholder */}
            <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow">
              <h2 className="text-2xl font-bold mb-6">Billing Details</h2>
              <p className="text-neutral-600 mb-4">
                ⚠️ Checkout form coming soon! This page will include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-neutral-600 mb-8">
                <li>Billing information form (name, email, address)</li>
                <li>Shipping information section</li>
                <li>Payment method selection</li>
                <li>Form validation</li>
              </ul>
              <p className="text-sm text-neutral-500">
                For now, the checkout page shows your cart summary and price calculations.
              </p>
            </div>

            {/* Right Column - Order Summary */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

              {/* Cart Items */}
              <div className="divide-y mb-6">
                {cart.data.items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemove}
                    isUpdating={isUpdating}
                  />
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="font-medium">${(subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Shipping</span>
                  <span className="font-medium">${(shipping / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Tax (20%)</span>
                  <span className="font-medium">${(tax / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total</span>
                  <span className="text-primary-500">${(total / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <Button 
                  variant="accent" 
                  className="w-full"
                  onClick={() => {
                    alert("Checkout form and payment integration coming in next phase!");
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
