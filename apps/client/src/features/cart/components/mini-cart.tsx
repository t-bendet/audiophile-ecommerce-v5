import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { paths } from "@/config/paths";
import {
  useCart,
  useRemoveFromCart,
  useUpdateCartItem,
} from "@/features/cart/api/get-cart";
import { CartItem } from "@/features/cart/components/cart-item";
import currencyFormatter from "@/utils/formatters";
import { ShoppingCart } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router";

interface MiniCartProps {
  trigger: ReactNode;
}

export function MiniCart({ trigger }: MiniCartProps) {
  const [open, setOpen] = useState(false);
  const { data: cart, isLoading } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();
  const items = cart?.data.items ?? [];

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        placement="sheet-top-end"
        belowNav
        title={
          <span className="block px-6 pt-8 text-lg font-bold tracking-300 uppercase">
            cart ({cart?.data.itemCount || 0})
          </span>
        }
        className="flex flex-col"
      >
        <div className="flex-1 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <ShoppingCart className="mb-4 h-14 w-14 text-neutral-400" />
              <p className="font-bold">Your cart is empty</p>
              <p className="mt-1 text-sm opacity-50">
                Add items to get started
              </p>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
                isUpdating={isUpdating}
              />
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="flex flex-col gap-3 border-t px-6 pt-4 pb-8">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-lg font-bold">Subtotal</span>
              <span className="text-lg font-bold">
                {currencyFormatter(cart?.data.subtotal || 0)}
              </span>
            </div>
            <Link
              to={paths.checkout.checkout.path}
              onClick={() => setOpen(false)}
            >
              <Button variant="accent" className="w-full" size="lg">
                Go to Checkout
              </Button>
            </Link>
            <DialogClose asChild>
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </DialogClose>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
