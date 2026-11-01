import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

// Module-private like `buttonVariants`: the client's react-refresh rule allows
// only literal constants beside a component. Consumers use `<Badge variant>`.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-1 text-[0.625rem] font-bold tracking-300 whitespace-nowrap uppercase transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-neutral-900 text-neutral-100 [a&]:hover:bg-neutral-900/90",
        secondary: "bg-neutral-200 text-neutral-900 [a&]:hover:bg-neutral-400",
        outline:
          "border-neutral-900 text-neutral-900 [a&]:hover:bg-neutral-200",
        // The status pills of the admin design note: order status first, then
        // payment status. Delivered and Paid share a colour, as do Cancelled
        // and Failed.
        pending: "bg-neutral-200 text-neutral-500",
        processing: "bg-primary-400/30 text-primary-500",
        shipped: "bg-sky-100 text-sky-700",
        delivered: "bg-emerald-100 text-emerald-700",
        cancelled: "bg-primary-700/10 text-primary-700",
        paid: "bg-emerald-100 text-emerald-700",
        failed: "bg-primary-700/10 text-primary-700",
        refunded: "bg-amber-100 text-amber-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge };
