import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/spinner";

export default function LoadingSpinner(props: { classes?: string }) {
  return (
    <div className={cn("flex items-center justify-center", props.classes)}>
      <Spinner
        aria-label="Loading featured product section"
        variant="primary"
        size="xl"
        className="text-primary-500"
      />
      <p className="sr-only">Loading section...</p>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
