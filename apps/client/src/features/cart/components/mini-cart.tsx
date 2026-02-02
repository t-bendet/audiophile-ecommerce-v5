import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { paths } from "@/config/paths";
import {
  useCart,
  useRemoveFromCart,
  useUpdateCartItem,
} from "@/features/cart/api/get-cart";
import { CartItem } from "@/features/cart/components/cart-item";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router";

interface MiniCartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MiniCart({ open, onOpenChange }: MiniCartProps) {
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart ({cart?.data.itemCount || 0})
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : !cart?.data.items || cart.data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShoppingCart className="h-16 w-16 text-neutral-300 mb-4" />
              <p className="text-neutral-600 font-medium">Your cart is empty</p>
              <p className="text-sm text-neutral-500 mt-2">
                Add items to get started
              </p>
            </div>
          ) : (
            <div className="divide-y">
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
          )}
        </div>

        {cart?.data.items && cart.data.items.length > 0 && (
          <DrawerFooter className="border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-lg">Subtotal</span>
              <span className="font-bold text-lg">
                ${((cart.data.subtotal || 0) / 100).toFixed(2)}
              </span>
            </div>
            <Link
              to={paths.checkout.checkout.path}
              onClick={() => onOpenChange(false)}
            >
              <Button variant="accent" className="w-full" size="lg">
                Go to Checkout
              </Button>
            </Link>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </DrawerClose>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
