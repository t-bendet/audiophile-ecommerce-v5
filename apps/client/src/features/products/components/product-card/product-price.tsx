import currencyFormatter from "@/utils/formatters";
import { UseProductCardContext } from "./index";
import { cn } from "@/lib/cn";

export default function ProductPrice(props: { classes?: string }) {
  const { price } = UseProductCardContext();
  if (!price) {
    throw new Error("ProductPrice components must have a price in context.");
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
