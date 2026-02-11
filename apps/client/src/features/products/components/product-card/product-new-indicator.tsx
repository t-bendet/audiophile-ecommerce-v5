import { useProductCardContext } from "@/features/products/components/product-card/index";
import { cn } from "@/lib/cn";

export default function ProductNewIndicator(props: { classes?: string }) {
  const { isNewProduct } = useProductCardContext();
  return (
    <>
      {isNewProduct ? (
        <span
          className={cn(
            "tracking-900 text-primary-700 text-sm uppercase",
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
