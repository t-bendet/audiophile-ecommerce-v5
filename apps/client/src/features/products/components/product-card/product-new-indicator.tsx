import { useProductCardContext } from "@/features/products/components/product-card/context";
import { cn } from "@/lib/cn";

export default function ProductNewIndicator(props: { classes?: string }) {
  const { isNewProduct } = useProductCardContext();
  return (
    <>
      {isNewProduct ? (
        <span
          className={cn(
            "text-sm tracking-900 text-primary-700 uppercase",
            props.classes,
          )}
        >
          new product
        </span>
      ) : null}
    </>
  );
}

ProductNewIndicator.displayName = "ProductCard.NewIndicator";
