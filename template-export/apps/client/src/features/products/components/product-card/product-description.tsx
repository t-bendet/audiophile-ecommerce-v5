import { useProductCardContext } from "@/features/products/components/product-card/index";
import { cn } from "@/lib/cn";

export default function ProductDescription(props: { classes?: string }) {
  const { description } = useProductCardContext();
  return <p className={cn("mb-6 opacity-75", props.classes)}>{description}</p>;
}

ProductDescription.displayName = "ProductCard.Description";
