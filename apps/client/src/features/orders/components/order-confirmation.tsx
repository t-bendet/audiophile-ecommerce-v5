import ConfirmationIcon from "@/assets/icon-order-confirmation.svg?react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { paths } from "@/config/paths";
import currencyFormatter from "@/utils/formatters";
import { OrderDTO, paymentInstructions } from "@repo/domain";
import { Link } from "react-router";

type OrderConfirmationProps = {
  order: OrderDTO;
  /** Escape closes the receipt; a click outside does not. */
  onDismiss: () => void;
};

export function OrderConfirmation({
  order,
  onDismiss,
}: OrderConfirmationProps) {
  const [first, ...rest] = order.items;

  return (
    <Dialog
      defaultOpen
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
    >
      <DialogContent
        placement="centred"
        onInteractOutside={(event) => event.preventDefault()}
        title={
          <span className="block px-6 text-2xl font-bold tracking-300 uppercase md:px-12 md:text-3xl">
            Thank you for your order
          </span>
        }
        className="flex flex-col pt-8 md:pt-12"
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
                    width={first.productImage.width}
                    height={first.productImage.height}
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
      </DialogContent>
    </Dialog>
  );
}
