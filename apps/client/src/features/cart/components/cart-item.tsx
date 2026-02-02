import { Button } from "@/components/ui/button";
import { CartItemDTO } from "@repo/domain";
import { Minus, Plus, X } from "lucide-react";

interface CartItemProps {
  item: CartItemDTO;
  onUpdateQuantity: (cartItemId: string, quantity: number) => void;
  onRemove: (cartItemId: string) => void;
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
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleIncrease = () => {
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  return (
    <div className="flex items-center gap-4 py-4">
      {/* Product Image */}
      <img
        src={item.productImage}
        alt={item.productName}
        className="h-16 w-16 rounded object-cover"
      />

      {/* Product Details */}
      <div className="flex-1">
        <h3 className="font-bold text-sm">{item.productName}</h3>
        <p className="text-sm text-neutral-500">
          ${(item.productPrice / 100).toFixed(2)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDecrease}
          disabled={isUpdating || item.quantity === 1}
          className="h-8 w-8 p-0"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center font-bold">{item.quantity}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleIncrease}
          disabled={isUpdating}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(item.id)}
        disabled={isUpdating}
        className="h-8 w-8 p-0 text-neutral-500 hover:text-red-600"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
