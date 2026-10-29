import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

export default function ProductSkeleton({ classes }: { classes?: string }) {
  return (
    <article
      className={cn(
        "flex flex-col items-center justify-center space-y-4 text-center lg:items-start lg:text-left",
        classes,
      )}
    >
      <Skeleton className="mb-6 h-5 w-51" />
      <Skeleton className="mb-8 h-14 w-66" />
      <Skeleton className="mb-6 h-22 w-68" />
      <Skeleton className="h-12 w-46 rounded-none" />
      <p className="sr-only">Loading product details...</p>
      <span className="sr-only">Loading...</span>
    </article>
  );
}
