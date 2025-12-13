import { UseProductCardContext } from "./index";
import { cn } from "@/lib/cn";

export default function ProductNewIndicator(props: { classes?: string }) {
  const { isNewProduct } = UseProductCardContext();
  return (
    <>
      {isNewProduct ? (
        <span
          className={cn(
            "tracking-900 text-primary-500 text-sm uppercase",
            props.classes,
          )}
        >
          new product
        </span>
      ) : null}
    </>
  );
}
