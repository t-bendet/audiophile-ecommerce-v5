import CartIcon from "@/assets/icon-cart.svg?react";
import { useCart } from "@/features/cart/api/get-cart";

type TCartButtonProps = {
  onOpen: () => void;
};

export const CartButton = ({ onOpen }: TCartButtonProps) => {
  const { data: cart } = useCart();
  const itemCount = cart?.data.itemCount ?? 0;

  return (
    <button
      onClick={onOpen}
      className="hover:*:fill-primary-500 focus-visible:*:fill-primary-500 relative cursor-pointer"
      aria-label="Open cart"
    >
      <CartIcon title="cart icon" />
      {itemCount > 0 ? (
        <span className="bg-primary-500 absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white">
          {itemCount}
        </span>
      ) : null}
    </button>
  );
};
