import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

export type DialogPlacement = "sheet-top" | "sheet-top-end" | "centred";

const panel: Record<DialogPlacement, string> = {
  "sheet-top":
    "inset-x-0 max-h-[calc(100dvh-var(--nav-bar-height))] overflow-y-auto rounded-b-lg data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
  "sheet-top-end":
    "right-[max(1.5rem,calc((100%-var(--container-max-width))/2))] w-[calc(100%-3rem)] max-w-sm max-h-[calc(100dvh-var(--nav-bar-height)-3rem)] overflow-y-auto rounded-lg data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-4 sm:right-[max(2.5rem,calc((100%-var(--container-max-width))/2))]",
  centred:
    "top-1/2 left-1/2 w-[calc(100%-3rem)] max-w-lg max-h-[calc(100dvh-3rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
};

const panelTop = (placement: DialogPlacement, belowNav: boolean) => {
  if (placement === "centred") return undefined;
  if (placement === "sheet-top-end") {
    return belowNav ? "top-[calc(var(--nav-bar-height)+1.5rem)]" : "top-6";
  }
  return belowNav ? "top-(--nav-bar-height)" : "top-0";
};

function Dialog(props: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(props: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogClose(props: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

type DialogContentProps = Omit<
  ComponentProps<typeof DialogPrimitive.Content>,
  "title"
> & {
  placement: DialogPlacement;
  /** Starts the overlay and the panel under the storefront nav bar. */
  belowNav?: boolean;
  title: ReactNode;
  srOnlyTitle?: boolean;
  description?: ReactNode;
  closeButton?: boolean;
};

function DialogContent({
  placement,
  belowNav = false,
  title,
  srOnlyTitle = false,
  description,
  closeButton = false,
  className,
  children,
  ...props
}: DialogContentProps) {
  // Without a description, only an explicit undefined stops Radix pointing at a missing id.
  const describedBy = description ? {} : { "aria-describedby": undefined };

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        data-testid="dialog-overlay"
        className={cn(
          "fixed inset-0 z-50 bg-neutral-900/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
          belowNav && "top-(--nav-bar-height)",
        )}
      />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed z-50 bg-white text-neutral-900 shadow-xl duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in",
          panel[placement],
          panelTop(placement, belowNav),
          className,
        )}
        {...props}
        {...describedBy}
      >
        <DialogPrimitive.Title className={cn(srOnlyTitle && "sr-only")}>
          {title}
        </DialogPrimitive.Title>
        {description && (
          <DialogPrimitive.Description>
            {description}
          </DialogPrimitive.Description>
        )}
        {children}
        {closeButton && (
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-4 right-4 rounded-full p-2 opacity-60 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-hidden"
          >
            <XIcon className="size-5" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger };
