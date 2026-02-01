import { cn } from "@/lib/cn";
import { Spinner, type SpinnerProps } from "@/components/ui/spinner";

export default function LoadingSpinner({
  className,
  variant = "primary",
  size = "xl",
}: SpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Spinner
        aria-label="Loading featured product section"
        variant={variant}
        size={size}
        className="text-primary-500"
      />
      <p className="sr-only">Loading section...</p>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
