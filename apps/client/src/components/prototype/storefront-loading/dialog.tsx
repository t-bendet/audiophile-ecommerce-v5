// PROTOTYPE (#359): one Radix Dialog primitive with placement variants, standing in for
// ui/dialog (mobile menu), ui/drawer (vaul mini-cart) and the inline thank-you.
// The storefront offset is an opt-in `belowNav` prop, so the overlay's default covers the
// viewport and admin dialogs inherit nothing.
import { cn } from "@/lib/cn";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

export type Placement =
  | "sheet-top" // full width, drops from the top edge
  | "sheet-top-end" // a panel under the nav, aligned to the container's right edge
  | "drawer" // rises from the bottom edge
  | "drawer-then-centred" // bottom drawer on a phone, centred from md
  | "centred"
  | "side-start"
  | "side-end"
  | "fullscreen";

const panel: Record<Placement, string> = {
  "sheet-top":
    "inset-x-0 top-0 max-h-[calc(100dvh-var(--nav-bar-height))] overflow-y-auto rounded-b-lg data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
  "sheet-top-end":
    "top-6 right-[max(1.5rem,calc((100vw-70rem)/2))] w-[calc(100vw-3rem)] max-w-sm max-h-[calc(100dvh-var(--nav-bar-height)-3rem)] overflow-y-auto rounded-lg data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-4",
  drawer:
    "inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
  "drawer-then-centred":
    "inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom md:inset-x-auto md:bottom-auto md:top-1/2 md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=open]:zoom-in-95",
  centred:
    "top-1/2 left-1/2 w-[calc(100vw-3rem)] max-w-lg max-h-[calc(100dvh-3rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
  "side-start":
    "inset-y-0 left-0 w-[85vw] max-w-sm overflow-y-auto data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
  "side-end":
    "inset-y-0 right-0 w-[90vw] max-w-md overflow-y-auto data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
  fullscreen:
    "inset-0 overflow-y-auto data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
};

export const ProtoDialog = DialogPrimitive.Root;
export const ProtoDialogTrigger = DialogPrimitive.Trigger;
export const ProtoDialogClose = DialogPrimitive.Close;
export const ProtoDialogTitle = DialogPrimitive.Title;

export function ProtoDialogContent({
  placement,
  belowNav = false,
  title,
  srOnlyTitle = false,
  closeButton = false,
  handle = false,
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof DialogPrimitive.Content>, "title"> & {
  placement: Placement;
  belowNav?: boolean;
  title: ReactNode;
  srOnlyTitle?: boolean;
  closeButton?: boolean;
  handle?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-neutral-900/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
          belowNav && "top-(--nav-bar-height)",
        )}
      />
      <DialogPrimitive.Content
        // The title names the dialog; there is no separate description.
        aria-describedby={undefined}
        className={cn(
          "fixed z-50 bg-white text-neutral-900 shadow-xl duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in",
          panel[placement],
          belowNav &&
            (placement === "sheet-top-end"
              ? "top-[calc(var(--nav-bar-height)+1.5rem)]"
              : "top-(--nav-bar-height)"),
          className,
        )}
        {...props}
      >
        {handle && (
          <div
            aria-hidden
            className={cn(
              "order-first mx-auto mt-3 h-1.5 w-12 rounded-full bg-neutral-400",
              placement === "drawer-then-centred" && "md:hidden",
            )}
          />
        )}
        <DialogPrimitive.Title className={cn(srOnlyTitle && "sr-only")}>
          {title}
        </DialogPrimitive.Title>
        {children}
        {closeButton && (
          <DialogPrimitive.Close
            className="absolute top-4 right-4 rounded-full p-2 text-neutral-900 opacity-60 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-hidden"
            aria-label="Close"
          >
            <XIcon className="size-5" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
