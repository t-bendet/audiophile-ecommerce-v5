import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  " inline-flex items-center font-bold  cursor-pointer tracking-600 justify-center gap-2 whitespace-nowrap text-xs uppercase  transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:focus-visible:ring-neutral-300",
  {
    variants: {
      variant: {
        default:
          "bg-neutral-900 text-neutral-50 shadow-sm hover:bg-neutral-900/90 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90",
        accent:
          "bg-primary-500 text-neutral-100 shadow-xs hover:bg-primary-400 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90",
        outline:
          "border text-neutral-900 border-neutral-900 bg-transparent shadow-xs hover:bg-neutral-900 hover:text-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
        outlineReversed:
          "border border-neutral-900 bg-neutral-900 text-neutral-100 shadow-xs hover:bg-transparent hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:hover:bg-neutral-800",
        destructive:
          "bg-red-500 text-neutral-50 shadow-xs hover:bg-red-500/90 dark:bg-red-900 dark:text-neutral-50 dark:hover:bg-red-900/90",
        link: "text-neutral-900 text-[15px] opacity-50 underline-offset-4 hover:underline dark:text-neutral-50",
      },
      size: {
        default: "h-12  px-7",
        sm: "h-8 px-3 text-xs",
        lg: "h-12  w-full",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
