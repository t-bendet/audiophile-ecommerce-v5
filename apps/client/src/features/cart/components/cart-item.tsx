import { Button } from "@/components/ui/button";
import { CartItemDTO } from "@repo/domain";
import { X } from "lucide-react";

interface CartItemProps {
  item: CartItemDTO;
  onUpdateQuantity: (
    productId: string,
    cartItemId: string,
    quantity: number,
  ) => void;
  onRemove: (productId: string, cartItemId: string) => void;
  isUpdating?: boolean;
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating = false,
}: CartItemProps) {
  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.productId, item.id, item.quantity - 1);
    }
  };

  const handleIncrease = () => {
    onUpdateQuantity(item.productId, item.id, item.quantity + 1);
  };

  return (
    <div className="flex items-center gap-4 py-4 text-neutral-900">
      {/* Product Image */}
      <img
        src={item.productImage}
        alt={item.cartLabel}
        className="h-16 w-16 rounded object-cover"
      />

      {/* Product Details */}
      <div className="flex h-full flex-1 flex-col gap-1">
        <h3 className="text-sm font-bold uppercase">{item.cartLabel}</h3>
        <p className="text-sm text-neutral-500">
          $ {(item.productPrice / 100).toFixed(2)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <div className="flex h-12 w-30 items-center justify-around bg-neutral-200 text-xs font-bold">
          <button
            className="cursor-pointer px-3 opacity-25 hover:opacity-50"
            onClick={handleDecrease}
            disabled={isUpdating || item.quantity === 1}
          >
            -
          </button>
          <p>{item.quantity}</p>
          <button
            className="cursor-pointer px-3 opacity-25 hover:opacity-50"
            onClick={handleIncrease}
            disabled={isUpdating}
          >
            +
          </button>
        </div>
        {/* Remove Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRemove(item.productId, item.id)}
          disabled={isUpdating}
          className="h-8 w-8 p-0 text-neutral-500 hover:text-red-600"
        >
          <X className="h-2 w-2" />
        </Button>
      </div>
    </div>
  );
}
