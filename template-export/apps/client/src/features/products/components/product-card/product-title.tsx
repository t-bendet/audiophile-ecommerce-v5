import { useProductCardContext } from "@/features/products/components/product-card/index";
import { cn } from "@/lib/cn";
import { Fragment } from "react/jsx-runtime";

export default function ProductTitle(props: { classes?: string }) {
  const { fullLabel: title } = useProductCardContext();
  return (
    <header>
      <h2
        className={cn(
          "tracking-400 mb-6 text-2xl font-bold uppercase md:text-4xl",
          props.classes,
        )}
      >
        {title.map((word) => (
          <Fragment key={word}>
            {word} <br />
          </Fragment>
        ))}
      </h2>
    </header>
  );
}

ProductTitle.displayName = "ProductCard.Title";
