import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      className="font-Manrope!"
      toastOptions={{
        classNames: {
          toast: "rounded-lg! border! shadow-lg!",
          title: "text-sm! font-bold!",
          description: "text-xs! text-inherit! opacity-90",
          success: "border-neutral-200! bg-neutral-100! text-neutral-900!",
          error: "border-primary-700! bg-primary-700! text-neutral-100!",
          closeButton: "border-neutral-400! bg-neutral-100! text-neutral-900!",
        },
      }}
      {...props}
    />
  );
}
