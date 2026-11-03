// PROTOTYPE (#359): the mobile menu, the mini-cart and the thank-you on the one primitive,
// placed per dialog variant. Accessible names match the phone E2E specs.
import ConfirmationIcon from "@/assets/icon-order-confirmation.svg?react";
import HamburgerIcon from "@/assets/icon-hamburger.svg?react";
import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { paths } from "@/config/paths";
import {
  useCart,
  useRemoveFromCart,
  useUpdateCartItem,
} from "@/features/cart/api/get-cart";
import { CartItem } from "@/features/cart/components/cart-item";
import CategoryNavList from "@/features/categories/components/category-nav-list";
import currencyFormatter from "@/utils/formatters";
import { OrderDTO, paymentInstructions } from "@repo/domain";
import { ShoppingCart } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import {
  ProtoDialog,
  ProtoDialogClose,
  ProtoDialogContent,
  ProtoDialogTrigger,
  type Placement,
} from "./dialog";
import { useProto } from "./store";

type Surface = { placement: Placement; belowNav: boolean };

const PLACEMENTS: Record<
  "A" | "B" | "C",
  { menu: Surface; cart: Surface; thankYou: Surface }
> = {
  A: {
    menu: { placement: "sheet-top", belowNav: true },
    cart: { placement: "sheet-top-end", belowNav: true },
    thankYou: { placement: "centred", belowNav: false },
  },
  B: {
    menu: { placement: "drawer", belowNav: false },
    cart: { placement: "drawer-then-centred", belowNav: false },
    thankYou: { placement: "drawer-then-centred", belowNav: false },
  },
  C: {
    menu: { placement: "side-start", belowNav: false },
    cart: { placement: "side-end", belowNav: false },
    thankYou: { placement: "fullscreen", belowNav: false },
  },
};

const isDrawer = (p: Placement) =>
  p === "drawer" || p === "drawer-then-centred";

export function PrototypeMenu() {
  const { dialog } = useProto();
  const { placement, belowNav } = PLACEMENTS[dialog].menu;
  const [open, setOpen] = useState(false);

  return (
    <ProtoDialog open={open} onOpenChange={setOpen}>
      <ProtoDialogTrigger asChild>
        <Button className="h-4 p-0 hover:*:*:fill-primary-500 focus-visible:*:*:fill-primary-500">
          <span className="sr-only">Open main menu</span>
          <HamburgerIcon title="hamburger icon" />
        </Button>
      </ProtoDialogTrigger>
      <ProtoDialogContent
        placement={placement}
        belowNav={belowNav}
        title={
          <span className="block px-6 pt-6 text-xs font-bold tracking-600 uppercase opacity-50">
            Main menu
          </span>
        }
        srOnlyTitle={placement === "sheet-top"}
        closeButton={placement !== "sheet-top"}
        handle={isDrawer(placement)}
        className={
          placement === "sheet-top" ? "px-6 pt-20 pb-8 md:px-10 md:py-14" : ""
        }
      >
        <div
          className={
            placement === "sheet-top"
              ? ""
              : "px-6 pt-16 pb-10 [&_ul]:gap-16 [&_ul]:md:flex-col"
          }
        >
          <SafeRenderWithErrorBlock
            title="Error loading categories"
            containerClasses="mb-30"
          >
            <CategoryNavList clickHandler={() => setOpen(false)} />
          </SafeRenderWithErrorBlock>
        </div>
      </ProtoDialogContent>
    </ProtoDialog>
  );
}

export function PrototypeMiniCart({ trigger }: { trigger: ReactNode }) {
  const { dialog } = useProto();
  const { placement, belowNav } = PLACEMENTS[dialog].cart;
  const [open, setOpen] = useState(false);
  const { data: cart, isLoading } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();
  const isUpdating = updateCartItem.isPending || removeFromCart.isPending;
  const items = cart?.data.items ?? [];

  return (
    <ProtoDialog open={open} onOpenChange={setOpen}>
      <ProtoDialogTrigger asChild>{trigger}</ProtoDialogTrigger>
      <ProtoDialogContent
        placement={placement}
        belowNav={belowNav}
        handle={isDrawer(placement)}
        closeButton={placement === "side-end"}
        title={
          <span className="block px-6 pt-8 text-lg font-bold tracking-300 uppercase">
            cart ({cart?.data.itemCount || 0})
          </span>
        }
        className="flex flex-col"
      >
        <div className="flex-1 px-6">
          {isLoading ? (
            <div className="space-y-4 py-6">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 bg-neutral-400/60" />
                  <Skeleton className="h-4 flex-1 bg-neutral-400/60" />
                </div>
              ))}
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
                onUpdateQuantity={(productId, cartItemId, quantity) =>
                  updateCartItem.mutate({ productId, cartItemId, quantity })
                }
                onRemove={(productId, cartItemId) =>
                  removeFromCart.mutate({ productId, cartItemId })
                }
                isUpdating={isUpdating}
              />
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="flex flex-col gap-3 px-6 pt-4 pb-8">
            <div className="mb-2 flex items-center justify-between">
              <span className="uppercase opacity-50">Total</span>
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
            <ProtoDialogClose asChild>
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </ProtoDialogClose>
          </div>
        )}
      </ProtoDialogContent>
    </ProtoDialog>
  );
}

export function PrototypeThankYou({
  order,
  onClose,
}: {
  order: OrderDTO;
  onClose: () => void;
}) {
  const { dialog } = useProto();
  const { placement, belowNav } = PLACEMENTS[dialog].thankYou;
  const [first, ...rest] = order.items;

  return (
    <ProtoDialog open onOpenChange={(open) => !open && onClose()}>
      <ProtoDialogContent
        placement={placement}
        belowNav={belowNav}
        handle={isDrawer(placement)}
        closeButton={placement === "fullscreen"}
        // The order is placed: a stray tap outside must not dismiss the receipt.
        onInteractOutside={(event) => event.preventDefault()}
        title={
          <span className="block px-6 text-2xl font-bold tracking-300 uppercase md:px-12 md:text-3xl">
            Thank you
            <br />
            for your order
          </span>
        }
        className={
          placement === "fullscreen"
            ? "flex flex-col justify-center pt-8 md:items-center [&>*]:md:w-full [&>*]:md:max-w-xl"
            : "flex flex-col pt-8 md:pt-12"
        }
      >
        <div className="order-first px-6 pb-6 md:px-12 md:pb-8">
          <ConfirmationIcon aria-hidden />
        </div>
        <div className="px-6 pt-4 pb-8 md:px-12 md:pb-12">
          <p className="mb-6 text-sm opacity-50">
            We have received your order {order.id}.{" "}
            {paymentInstructions(order.paymentMethod)} We have sent a
            confirmation to {order.shippingAddress.email}.
          </p>
          <div className="mb-6 grid overflow-hidden rounded-lg md:grid-cols-[1fr_auto]">
            <div className="bg-neutral-200 p-6">
              {first && (
                <div className="flex items-center gap-4">
                  <img
                    src={first.productImage.src}
                    alt=""
                    className="h-12 w-12 rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold uppercase">
                      {first.productName}
                    </p>
                    <p className="text-sm opacity-50">
                      {currencyFormatter(first.price)}
                    </p>
                  </div>
                  <span className="text-sm font-bold opacity-50">
                    x{first.quantity}
                  </span>
                </div>
              )}
              {rest.length > 0 && (
                <p className="mt-3 border-t border-neutral-400 pt-3 text-center text-xs font-bold opacity-50">
                  and {rest.length} other item(s)
                </p>
              )}
            </div>
            <div className="flex flex-col justify-center bg-neutral-900 p-6 text-white md:min-w-48">
              <span className="uppercase opacity-50">Grand total</span>
              <span className="text-lg font-bold">
                {currencyFormatter(order.total)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to={paths.account.orders.getHref()} className="flex-1">
              <Button variant="accent" size="lg" className="w-full">
                View your orders
              </Button>
            </Link>
            <Link to={paths.home.getHref()} className="flex-1">
              <Button variant="outline" size="lg" className="w-full">
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </ProtoDialogContent>
    </ProtoDialog>
  );
}
