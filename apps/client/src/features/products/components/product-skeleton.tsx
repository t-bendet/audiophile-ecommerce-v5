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
      <Skeleton className="w-51 mb-6 h-5" />
      <Skeleton className="w-66 mb-8 h-14" />
      <Skeleton className="h-22 w-68 mb-6" />
      <Skeleton className="w-46 h-12 rounded-none" />
      <p className="sr-only">Loading product details...</p>
      <span className="sr-only">Loading...</span>
    </article>
  );
}
