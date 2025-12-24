import { useProductCardContext } from "@/features/products/components/product-card/index";
import { cn } from "@/lib/cn";
import currencyFormatter from "@/utils/formatters";
import { AppError, ErrorCode } from "@repo/domain";

export default function ProductPrice(props: { classes?: string }) {
  const { price } = useProductCardContext();
  if (!price) {
    throw new AppError(
      "ProductPrice components must have a price in context.",
      ErrorCode.COMPONENT_COMPOSITION_ERROR,
    );
  }
  return (
    <p
      className={cn(
        "mb-8 text-lg font-semibold md:text-xl lg:mb-10",
        props.classes,
      )}
    >
      {currencyFormatter(price)}
    </p>
  );
}

ProductPrice.displayName = "ProductCard.Price";
