import CartIcon from "@/assets/icon-cart.svg?react";
import { useCart } from "@/features/cart/api/get-cart";
import type { ComponentProps } from "react";

export const CartButton = (props: ComponentProps<"button">) => {
  const { data: cart } = useCart();
  const itemCount = cart?.data.itemCount ?? 0;

  return (
    <button
      {...props}
      className="relative cursor-pointer hover:*:fill-primary-500 focus-visible:*:fill-primary-500"
      aria-label="Open cart"
    >
      <CartIcon title="cart icon" />
      {itemCount > 0 ? (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
          {itemCount}
        </span>
      ) : null}
    </button>
  );
};
